import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session, Exam, ExamType, AuditLedger
from app.redis_client import publish_event
from app.security_utils import calculate_sha256

router = APIRouter()

class SectionConfig(BaseModel):
    name: str
    count: int
    marks_per_correct: float
    negative_marks: float
    question_type: str

class ExamCreate(BaseModel):
    name: str
    exam_type_id: int
    date: str
    shift: str
    duration: int
    security_level: str
    config_json: dict  # attempt rules, proctoring, sections, languages

@router.post("/create", response_model=Exam)
def create_exam(exam_in: ExamCreate, db: Session = Depends(get_session)):
    # Verify exam type exists
    exam_type = db.get(ExamType, exam_in.exam_type_id)
    if not exam_type:
        raise HTTPException(status_code=404, detail="Exam type template not found")
        
    exam = Exam(
        exam_type_id=exam_in.exam_type_id,
        name=exam_in.name,
        date=exam_in.date,
        shift=exam_in.shift,
        duration=exam_in.duration,
        security_level=exam_in.security_level,
        config_json=json.dumps(exam_in.config_json)
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    
    # Audit log entry
    event_data = {"exam_id": exam.id, "name": exam.name, "security": exam.security_level}
    audit = AuditLedger(
        exam_id=exam.id,
        event_type="EXAM_CREATED",
        actor_id="admin",
        actor_role="SuperAdmin",
        payload_json=json.dumps(event_data),
        event_hash=calculate_sha256(json.dumps(event_data).encode('utf-8'))
    )
    db.add(audit)
    db.commit()
    
    # Publish to Redis
    publish_event(f"omnishield:exam:{exam.id}", "EXAM_CREATED", event_data)
    
    return exam

@router.get("", response_model=List[Exam])
def get_all_exams(db: Session = Depends(get_session)):
    return db.exec(select(Exam)).all()

@router.get("/{id}", response_model=Exam)
def get_exam_by_id(id: int, db: Session = Depends(get_session)):
    exam = db.get(Exam, id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.patch("/{id}/status")
def update_exam_status(id: int, status: str, db: Session = Depends(get_session)):
    exam = db.get(Exam, id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    valid_statuses = ["SETUP", "SEALED", "DISTRIBUTED", "LIVE", "SUBMITTED", "RESULTS"]
    if status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    old_status = exam.status
    exam.status = status.upper()
    db.add(exam)
    
    # Write audit log
    event_data = {"exam_id": id, "old_status": old_status, "new_status": status}
    audit = AuditLedger(
        exam_id=id,
        event_type="EXAM_STATUS_UPDATED",
        actor_id="admin",
        actor_role="SuperAdmin",
        payload_json=json.dumps(event_data),
        event_hash=calculate_sha256(json.dumps(event_data).encode('utf-8'))
    )
    db.add(audit)
    db.commit()
    
    # Publish Redis update
    publish_event("omnishield:centers", "EXAM_STATUS_CHANGE", event_data)
    
    return {"status": "SUCCESS", "new_status": exam.status}
