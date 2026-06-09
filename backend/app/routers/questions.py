import json
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select

from app.database import get_session, Question, UploadedPaper, ExtractedQuestionStaging, AuditLedger
from app.redis_client import publish_event, increment_live_counter
from app.security_utils import calculate_sha256
from app.agents import run_draft_agent, run_vector_agent, run_validate_agent, run_bloom_agent, run_upload_agent

router = APIRouter()

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
    
    # 2. Similarity Vector Check
    text = draft.get("text_json", {}).get("en", "")
    sim_check = run_vector_agent(text)
    
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

@router.post("/import")
async def import_paper_document(
    exam_type_id: int = Form(...),
    year: int = Form(...),
    shift: str = Form(...),
    source_type: str = Form(...),
    language: str = Form(...),
    upload_purpose: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_session)
):
    # Save file buffer to dummy directory (simulate MinIO upload)
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
    
    # Run Parser Agent (simulated in thread/Celery)
    extracted_qs = run_upload_agent(file_path, paper.file_type)
    
    # Populate staging table
    total_extracted = 0
    for eq in extracted_qs:
        staging_q = ExtractedQuestionStaging(
            paper_id=paper.id,
            q_number=eq.get("q_number"),
            q_type=eq.get("q_type"),
            text_json=eq.get("text_json"),
            options_json=eq.get("options_json"),
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
    
    publish_event("omnishield:log", "PAPER_STAGED", {"paper_id": paper.id, "extracted": total_extracted})
    
    return {"status": "SUCCESS", "paper_id": paper.id, "extracted_count": total_extracted}

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
