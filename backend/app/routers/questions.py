import json
import os
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session, Question, UploadedPaper, ExtractedQuestionStaging, AuditLedger, SystemConfig
from app.redis_client import publish_event, increment_live_counter
from app.security_utils import calculate_sha256
from app.agents import run_draft_agent, run_vector_agent, run_validate_agent, run_bloom_agent, run_upload_agent
from app.celery_worker import process_paper_upload_pipeline, final_import_to_bank

router = APIRouter()

class StagedQuestionEdit(BaseModel):
    text: str
    options: dict
    correct_answer: str
    q_type: str

@router.post("/generate")
def generate_question(
    exam_type_id: int,
    subject: str,
    difficulty: str,
    question_type: str,
    db: Session = Depends(get_session)
):
    # 1. Draft
    draft = run_draft_agent("NEET UG", subject, difficulty, question_type)
    
    # 2. Similarity Vector Check using database configuration
    text = draft.get("text_json", {}).get("en", "")
    
    threshold_cfg = db.exec(select(SystemConfig).where(SystemConfig.key == "similarity_threshold")).first()
    threshold = float(threshold_cfg.value) if threshold_cfg else 0.85
    
    sim_check = run_vector_agent(text, threshold=threshold)
    
    # 3. Factual Validation
    validation = run_validate_agent(draft)
    
    # 4. Bloom tag classification
    bloom = run_bloom_agent(text)
    
    # Combine metadata and check if we should flag it
    status = "APPROVED"
    if sim_check.get("is_duplicate") or validation.get("status") == "FLAGGED":
        status = "FLAGGED"
    
    audit_hash = calculate_sha256(json.dumps(draft).encode('utf-8'))
    
    # Create DB question
    db_q = Question(
        exam_type_id=exam_type_id,
        text_json=json.dumps(draft.get("text_json")),
        options_json=json.dumps(draft.get("options_json")),
        answer=draft.get("answer"),
        subject=subject,
        chapter=bloom.get("concepts_detected", ["General"])[0] if bloom.get("concepts_detected") else "General",
        topic=bloom.get("concepts_detected", ["Concept"])[0] if bloom.get("concepts_detected") else "Concept",
        bloom_level=bloom.get("bloom_level"),
        difficulty=bloom.get("difficulty"),
        question_type=question_type,
        source="Synthetic",
        audit_hash=audit_hash,
        status=status
    )
    db.add(db_q)
    db.commit()
    db.refresh(db_q)
    
    # Update live count
    increment_live_counter("questions_banked")
    
    # Write audit log
    event_data = {"question_id": db_q.id, "subject": db_q.subject, "status": db_q.status}
    audit = AuditLedger(
        exam_id=None,
        event_type="QUESTION_GENERATED",
        actor_id="scout_agent",
        actor_role="Invigilator",
        payload_json=json.dumps(event_data),
        event_hash=calculate_sha256(json.dumps(event_data).encode('utf-8'))
    )
    db.add(audit)
    db.commit()
    db.refresh(db_q)
    
    # Publish real-time counter update
    publish_event("omnishield:questions", "NEW_QUESTION", event_data)
    
    return {
        "status": "SUCCESS",
        "question": db_q,
        "pipeline_metrics": {
            "similarity_score": sim_check.get("similarity_score"),
            "validation_status": validation.get("status"),
            "bloom_level": bloom.get("bloom_level")
        }
    }

@router.get("", response_model=List[Question])
def list_questions(
    subject: Optional[str] = None,
    bloom: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_session)
):
    stmt = select(Question)
    if subject:
        stmt = stmt.where(Question.subject == subject)
    if bloom:
        stmt = stmt.where(Question.bloom_level == bloom)
    if status:
        stmt = stmt.where(Question.status == status)
    return db.exec(stmt).all()

@router.get("/stats")
def get_questions_stats(db: Session = Depends(get_session)):
    """
    Returns real statistics using DB COUNT queries.
    """
    approved = len(db.exec(select(Question).where(Question.status == "APPROVED")).all())
    discarded = len(db.exec(select(Question).where(Question.status == "DISCARDED")).all())
    flagged = len(db.exec(select(Question).where(Question.status == "FLAGGED")).all())
    
    # Subject distribution
    subjects = ["Biology", "Physics", "Chemistry"]
    subject_counts = {}
    for s in subjects:
        subject_counts[s] = len(db.exec(select(Question).where(Question.subject == s)).all())
        
    # Bloom distribution
    blooms = ["L1 Remember", "L2 Understand", "L3 Apply", "L4 Analyse", "L5 Evaluate", "L6 Create"]
    bloom_counts = {}
    for b in blooms:
        bloom_counts[b] = len(db.exec(select(Question).where(Question.bloom_level == b)).all())
        
    # Throughput by hour
    all_qs = db.exec(select(Question.created_at)).all()
    throughput = {}
    for dt in all_qs:
        if dt:
            hour_str = dt.strftime("%H:00")
            throughput[hour_str] = throughput.get(hour_str, 0) + 1
            
    return {
        "counters": {
            "approved": approved,
            "discarded": discarded,
            "flagged": flagged,
            "total": approved + discarded + flagged
        },
        "subject_split": subject_counts,
        "bloom_distribution": bloom_counts,
        "throughput": [{"time": k, "count": v} for k, v in sorted(throughput.items())][-10:]
    }

@router.post("/import")
async def import_paper_document(
    exam_type_id: int = Form(...),
    year: int = Form(...),
    shift: str = Form(...),
    source_type: str = Form(...),
    language: str = Form(...),
    upload_purpose: str = Form(...),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_session)
):
    upload_dir = "public/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    # Save Header Record
    paper = UploadedPaper(
        original_filename=file.filename,
        file_url=file_path,
        file_type=file.filename.split(".")[-1],
        exam_type_id=exam_type_id,
        year=year,
        shift=shift,
        source_type=source_type,
        language=language,
        upload_purpose=upload_purpose,
        status="PROCESSING"
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    
    # Run Parser Agent (asynchronous extraction)
    extracted_qs = run_upload_agent(file_path, paper.file_type)
    
    # Populate staging table
    total_extracted = 0
    for eq in extracted_qs:
        staging_q = ExtractedQuestionStaging(
            paper_id=paper.id,
            q_number=eq.get("q_number"),
            q_type=eq.get("q_type"),
            text_json=eq.get("text_json") if isinstance(eq.get("text_json"), str) else json.dumps(eq.get("text_json")),
            options_json=eq.get("options_json") if isinstance(eq.get("options_json"), str) else json.dumps(eq.get("options_json")),
            correct_answer=eq.get("correct_answer"),
            confidence_score=eq.get("confidence_score"),
            ocr_raw_text=eq.get("ocr_raw_text")
        )
        db.add(staging_q)
        total_extracted += 1
        
    paper.status = "STAGED"
    paper.total_extracted = total_extracted
    db.add(paper)
    db.commit()
    
    # Trigger Celery Worker process simulation
    try:
        process_paper_upload_pipeline.delay(paper.id)
    except Exception as e:
        print(f"Warning: Celery broker offline. Processing in background thread. Error: {e}")
        if background_tasks:
            background_tasks.add_task(process_paper_upload_pipeline, paper.id)
        else:
            import threading
            threading.Thread(target=process_paper_upload_pipeline, args=(paper.id,)).start()
    
    return {"status": "SUCCESS", "paper_id": paper.id, "extracted_count": total_extracted}

@router.get("/uploaded-papers", response_model=List[UploadedPaper])
def list_uploaded_papers(db: Session = Depends(get_session)):
    return db.exec(select(UploadedPaper)).all()

@router.get("/staged-questions/{paper_id}", response_model=List[ExtractedQuestionStaging])
def get_staged_questions(paper_id: int, db: Session = Depends(get_session)):
    return db.exec(select(ExtractedQuestionStaging).where(ExtractedQuestionStaging.paper_id == paper_id)).all()

@router.post("/staged-questions/{id}/edit")
def edit_staged_question(id: int, edit: StagedQuestionEdit, db: Session = Depends(get_session)):
    """
    Saves inline edit directly to ExtractedQuestionStaging DB.
    """
    sq = db.get(ExtractedQuestionStaging, id)
    if not sq:
        raise HTTPException(status_code=404, detail="Staged question not found")
        
    sq.text_json = json.dumps({"en": edit.text})
    sq.options_json = json.dumps({"en": edit.options})
    sq.correct_answer = edit.correct_answer
    sq.q_type = edit.q_type
    sq.review_status = "EDITED"
    
    db.add(sq)
    db.commit()
    return {"status": "SUCCESS", "question": sq}

@router.post("/staged-questions/{id}/review")
def review_staged_question(id: int, action: str, db: Session = Depends(get_session)):
    sq = db.get(ExtractedQuestionStaging, id)
    if not sq:
        raise HTTPException(status_code=404, detail="Staged question not found")
        
    if action.upper() not in ["APPROVED", "SKIPPED", "FLAGGED"]:
        raise HTTPException(status_code=400, detail="Invalid review status action")
        
    sq.review_status = action.upper()
    db.add(sq)
    db.commit()
    return {"status": "SUCCESS", "review_status": sq.review_status}

@router.post("/uploaded-papers/{paper_id}/bulk-approve")
def bulk_approve_green_questions(paper_id: int, db: Session = Depends(get_session)):
    """
    Approves all questions with confidence >= 90%.
    """
    stmt = select(ExtractedQuestionStaging).where(
        ExtractedQuestionStaging.paper_id == paper_id,
        ExtractedQuestionStaging.confidence_score >= 0.90
    )
    qs = db.exec(stmt).all()
    for q in qs:
        q.review_status = "APPROVED"
        db.add(q)
    db.commit()
    return {"status": "SUCCESS", "approved_count": len(qs)}

@router.post("/uploaded-papers/{paper_id}/import-trigger")
def trigger_final_import(
    paper_id: int, 
    operator: str = "board_admin", 
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_session)
):
    """
    Triggers celery task to push reviewed items into primary bank.
    """
    # Trigger task
    try:
        final_import_to_bank.delay(paper_id, operator)
    except Exception as e:
        print(f"Warning: Celery broker offline. Running import task in background. Error: {e}")
        if background_tasks:
            background_tasks.add_task(final_import_to_bank, paper_id, operator)
        else:
            import threading
            threading.Thread(target=final_import_to_bank, args=(paper_id, operator)).start()
            
    return {"status": "SUCCESS", "message": "Celery import task queued."}

@router.post("/{id}/approve")
def approve_question(id: int, db: Session = Depends(get_session)):
    q = db.get(Question, id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.status = "APPROVED"
    db.add(q)
    db.commit()
    return {"status": "SUCCESS", "question_id": q.id}

@router.post("/{id}/discard")
def discard_question(id: int, db: Session = Depends(get_session)):
    q = db.get(Question, id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.status = "DISCARDED"
    db.add(q)
    db.commit()
    return {"status": "SUCCESS", "question_id": q.id}
