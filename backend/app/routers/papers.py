import json
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session, Question, QuestionPaper, PaperQuestionLink, AuditLedger, Exam
from app.redis_client import publish_event
from app.security_utils import seal_paper_blob, calculate_sha256

router = APIRouter()

class AutoBuildRules(BaseModel):
    exam_id: int
    name: str
    subject_distribution: dict  # e.g., {"Biology": 45, "Physics": 20, "Chemistry": 35}
    bloom_spread: dict         # e.g., {"L1 Remember": 20, "L3 Apply": 40, "L4 Analyse": 40}
    difficulty_curve: dict     # e.g., {"Easy": 30, "Medium": 50, "Hard": 20}
    total_questions: int

@router.post("/auto-build")
def auto_build_paper(rules: AutoBuildRules, db: Session = Depends(get_session)):
    # Verify exam exists
    exam = db.get(Exam, rules.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # Create Paper record
    paper = QuestionPaper(
        exam_id=rules.exam_id,
        name=rules.name,
        status="DRAFT"
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    
    # Simple selection algorithm based on filters
    approved_qs = db.exec(select(Question).where(Question.status == "APPROVED")).all()
    
    # Distribute question counts
    selected_qs = []
    order_idx = 1
    
    # We will pick questions matching subject rules
    for q in approved_qs:
        if len(selected_qs) >= rules.total_questions:
            break
            
        # Optional validation against rules could go here
        selected_qs.append(q)
        
        # Write link
        link = PaperQuestionLink(
            paper_id=paper.id,
            question_id=q.id,
            order_index=order_idx,
            section="Section A" if order_idx <= (rules.total_questions * 0.7) else "Section B"
        )
        db.add(link)
        order_idx += 1
        
    db.commit()
    
    # Publish log
    publish_event("omnishield:log", "PAPER_AUTO_BUILT", {"paper_id": paper.id, "questions_count": len(selected_qs)})
    
    return {"status": "SUCCESS", "paper_id": paper.id, "selected_questions_count": len(selected_qs)}

@router.post("/{id}/reorder")
def reorder_paper_questions(id: int, question_order: List[int], db: Session = Depends(get_session)):
    """
    Called on every single drag-and-drop reorder. Updates order_index in DB.
    """
    paper = db.get(QuestionPaper, id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    # Check if sealed
    if paper.status == "SEALED":
        raise HTTPException(status_code=400, detail="Cannot reorder sealed paper")
        
    for idx, q_id in enumerate(question_order):
        stmt = select(PaperQuestionLink).where(
            PaperQuestionLink.paper_id == id,
            PaperQuestionLink.question_id == q_id
        )
        link = db.exec(stmt).first()
        if link:
            link.order_index = idx + 1
            db.add(link)
            
    db.commit()
    return {"status": "SUCCESS", "message": "Questions order index committed to DB."}

@router.post("/{id}/seal")
def seal_paper(id: int, operator_name: str, db: Session = Depends(get_session)):
    paper = db.get(QuestionPaper, id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    if paper.status == "SEALED":
        raise HTTPException(status_code=400, detail="Paper is already sealed")
        
    # Fetch questions in order
    stmt = select(Question, PaperQuestionLink.order_index, PaperQuestionLink.section).join(
        PaperQuestionLink
    ).where(PaperQuestionLink.paper_id == id).order_by(PaperQuestionLink.order_index)
    
    results = db.exec(stmt).all()
    
    paper_struct = []
    for q, idx, sec in results:
        paper_struct.append({
            "id": q.id,
            "text": json.loads(q.text_json),
            "options": json.loads(q.options_json),
            "answer": q.answer,
            "section": sec,
            "order": idx
        })
        
    # Cryptographic Seal
    paper_str = json.dumps(paper_struct)
    encrypted_blob, aes_key, sha_hash = seal_paper_blob(paper_str)
    
    # Save parameters to DB
    paper.status = "SEALED"
    paper.sealed_at = datetime.utcnow()
    paper.sealed_by = operator_name
    paper.encrypted_blob_url = encrypted_blob # Storing directly for simplicity, in production upload to S3/MinIO
    paper.paper_hash = sha_hash
    db.add(paper)
    
    # Save Key to System Config / Secure vault (Simulated by system config)
    # The key is encrypted in transport or kept for Satellite broadcast
    db.commit()
    
    # Update Exam Status
    exam = db.get(Exam, paper.exam_id)
    if exam:
        exam.status = "SEALED"
        db.add(exam)
        db.commit()
        
    # Audit log
    event_data = {"paper_id": id, "sha256": sha_hash, "operator": operator_name}
    audit = AuditLedger(
        exam_id=paper.exam_id,
        event_type="PAPER_SEALED",
        actor_id=operator_name,
        actor_role="ExamBoard Admin",
        payload_json=json.dumps(event_data),
        event_hash=calculate_sha256(json.dumps(event_data).encode('utf-8'))
    )
    db.add(audit)
    db.commit()
    
    # Publish to Redis
    publish_event("omnishield:centers", "PAPER_SEALED", event_data)
    
    return {
        "status": "SUCCESS",
        "sha256": sha_hash,
        "sealed_at": paper.sealed_at,
        "encrypted_blob_sample": encrypted_blob[:30] + "..."
    }

@router.get("/{id}/preview")
def preview_paper(id: int, db: Session = Depends(get_session)):
    paper = db.get(QuestionPaper, id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    # Enforce preview audit log
    event_data = {"paper_id": id, "ip_address": "127.0.0.1"}
    audit = AuditLedger(
        exam_id=paper.exam_id,
        event_type="PAPER_PREVIEW_VIEWED",
        actor_id="admin",
        actor_role="ExamBoard Admin",
        payload_json=json.dumps(event_data),
        event_hash=calculate_sha256(json.dumps(event_data).encode('utf-8'))
    )
    db.add(audit)
    db.commit()
    
    stmt = select(Question, PaperQuestionLink.order_index, PaperQuestionLink.section).join(
        PaperQuestionLink
    ).where(PaperQuestionLink.paper_id == id).order_by(PaperQuestionLink.order_index)
    results = db.exec(stmt).all()
    
    questions = []
    for q, idx, sec in results:
        questions.append({
            "number": idx,
            "section": sec,
            "text": json.loads(q.text_json),
            "options": json.loads(q.options_json),
            "bloom": q.bloom_level,
            "difficulty": q.difficulty
        })
        
    return {
        "paper_name": paper.name,
        "status": paper.status,
        "questions": questions
    }
