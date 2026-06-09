import os
import time
import json
from celery import Celery
from sqlmodel import Session, select

from app.database import get_session, UploadedPaper, ExtractedQuestionStaging, Question
from app.redis_client import publish_event, increment_live_counter

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", 6379)

celery_app = Celery(
    "omnishield_tasks",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/1",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/2"
)

@celery_app.task
def process_paper_upload_pipeline(paper_id: int):
    """
    Simulates the multi-stage document extraction queue.
    Publishes progress to the websocket channel.
    """
    db = next(get_session())
    paper = db.get(UploadedPaper, paper_id)
    if not paper:
        return
        
    steps = [
        ("OCR_START", "Running OpenCV deskew & layout preservation...", 10),
        ("TEXT_EXTRACTED", "Parsing PDF character structures...", 30),
        ("LLM_PARSING", "GPT-4o Vision identifying question boundaries...", 60),
        ("DUPLICATE_CHECK", "Checking ChromaDB cosine similarity threshold...", 80),
        ("STAGING_POPULATED", "Writing structured questions to review database...", 100)
    ]
    
    for event_type, desc, progress in steps:
        time.sleep(1.0)
        # Update progress in DB or publish
        publish_event(
            f"omnishield:upload:{paper_id}", 
            event_type, 
            {"paper_id": paper_id, "progress": progress, "description": desc}
        )
        
    paper.status = "STAGED"
    db.add(paper)
    db.commit()
    
    # Broadcast staged notification to NTA admins
    publish_event("omnishield:questions", "PAPER_STAGING_READY", {
        "paper_id": paper_id,
        "name": paper.original_filename,
        "total": paper.total_extracted
    })
