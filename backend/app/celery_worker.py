import os
import time
import json
from celery import Celery
from sqlmodel import Session, select

from app.database import get_session, UploadedPaper, ExtractedQuestionStaging, Question, AuditLedger
from app.redis_client import publish_event, increment_live_counter
from app.security_utils import calculate_sha256

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", 6379)

celery_app = Celery(
    "omnishield_tasks",
    broker=f"redis://{REDIS_HOST}:{REDIS_PORT}/1",
    backend=f"redis://{REDIS_HOST}:{REDIS_PORT}/2"
)

# Celery Beat Schedule Configuration
celery_app.conf.beat_schedule = {
    'run-scout-threat-monitor-every-30s': {
        'task': 'app.celery_worker.run_scout_task',
        'schedule': 30.0,
    },
}
celery_app.conf.timezone = 'UTC'

@celery_app.task
def run_scout_task():
    """
    Scout agent runs as Celery beat scheduled task
    """
    print("[CELERY BEAT] Launching Scout threat monitoring scraper...")
    try:
        from app.agents.scout_agent import run_scout_sync
        run_scout_sync()
    except Exception as e:
        print(f"[CELERY BEAT ERROR] Scout Agent run failed: {e}")

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

@celery_app.task
def final_import_to_bank(paper_id: int, operator_name: str = "board_admin"):
    """
    Celery task: final_import_to_bank()
    Each question: INSERT to questions table
    with source_paper_id, all tags, audit hash
    """
    db = next(get_session())
    paper = db.get(UploadedPaper, paper_id)
    if not paper or paper.status == "IMPORTED":
        return {"status": "SKIPPED", "imported_count": 0}
        
    stmt = select(ExtractedQuestionStaging).where(
        ExtractedQuestionStaging.paper_id == paper_id,
        ExtractedQuestionStaging.review_status.in_(["APPROVED", "UNREVIEWED", "EDITED"])
    )
    staged_questions = db.exec(stmt).all()
    
    imported_count = 0
    skipped_count = 0
    
    for sq in staged_questions:
        # Check duplicate again
        # Insert to questions bank
        text = json.loads(sq.text_json).get("en", "")
        audit_hash = calculate_sha256(text.encode('utf-8'))
        
        # Check if already in bank
        existing = db.exec(select(Question).where(Question.audit_hash == audit_hash)).first()
        if existing:
            skipped_count += 1
            sq.review_status = "SKIPPED"
            db.add(sq)
            continue
            
        q = Question(
            exam_type_id=paper.exam_type_id,
            text_json=sq.text_json,
            options_json=sq.options_json,
            answer=sq.correct_answer,
            subject="Biology" if "biology" in text.lower() else ("Physics" if "physics" in text.lower() else "Chemistry"),
            chapter="Extracted Chapter",
            topic="Extracted Topic",
            bloom_level="L3 Apply" if "calculate" in text.lower() else "L1 Remember",
            difficulty="Medium",
            question_type=sq.q_type,
            source="OCR-extracted",
            audit_hash=audit_hash,
            status="APPROVED"
        )
        db.add(q)
        db.commit()
        db.refresh(q)
        
        sq.review_status = "APPROVED"
        sq.final_question_id = q.id
        db.add(sq)
        imported_count += 1
        
        # Update live count
        increment_live_counter("questions_banked")
        
    paper.status = "IMPORTED"
    paper.total_imported = imported_count
    paper.total_skipped = skipped_count + paper.total_skipped
    db.add(paper)
    
    # Audit log
    event_data = {"paper_id": paper_id, "imported": imported_count, "skipped": skipped_count}
    audit = AuditLedger(
        exam_id=None,
        event_type="PAPER_FINAL_IMPORT",
        actor_id=operator_name,
        actor_role="ExamBoard Admin",
        payload_json=json.dumps(event_data),
        event_hash=calculate_sha256(json.dumps(event_data).encode('utf-8'))
    )
    db.add(audit)
    db.commit()
    
    # Broadcast final status
    publish_event("omnishield:questions", "PAPER_IMPORT_SUCCESS", {
        "paper_id": paper_id,
        "imported": imported_count,
        "total": imported_count
    })
    
    return {"status": "SUCCESS", "imported_count": imported_count}
