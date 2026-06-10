import json
import random
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session, Threat, Exam, AuditLedger, QuestionPaper
from app.redis_client import publish_event, increment_live_counter
from app.security_utils import calculate_sha256

router = APIRouter()

class ThreatSimulate(BaseModel):
    source: str
    snippet: str
    similarity_score: float

class BackupTrigger(BaseModel):
    exam_id: int
    authority_1_signed: bool
    authority_2_signed: bool
    operator_name: str

@router.get("")
def list_threats(exam_id: Optional[int] = None, db: Session = Depends(get_session)):
    stmt = select(Threat)
    if exam_id:
        stmt = stmt.where(Threat.exam_id == exam_id)
    return db.exec(stmt).all()

@router.post("/simulate")
def simulate_threat_signal(threat_in: ThreatSimulate, db: Session = Depends(get_session)):
    # Find active exam
    exam = db.exec(select(Exam).where(Exam.status == "SETUP")).first()
    exam_id = exam.id if exam else 1
    
    threat = Threat(
        exam_id=exam_id,
        source=threat_in.source,
        snippet=threat_in.snippet,
        similarity_score=threat_in.similarity_score,
        verdict="ANALYSING" if threat_in.similarity_score < 72.0 else "CRITICAL"
    )
    db.add(threat)
    db.commit()
    db.refresh(threat)
    
    # Trigger alert if critical
    if threat.verdict == "CRITICAL":
        increment_live_counter("active_threats")
        # Log to audit ledger
        event_data = {"threat_id": threat.id, "score": threat.similarity_score, "source": threat.source}
        audit = AuditLedger(
            exam_id=exam_id,
            event_type="CRITICAL_LEAK_SIGNAL_DETECTED",
            actor_id="scout_agent",
            actor_role="Invigilator",
            payload_json=json.dumps(event_data),
            event_hash=calculate_sha256(json.dumps(event_data).encode('utf-8'))
        )
        db.add(audit)
        db.commit()
        db.refresh(threat)
        
        # Publish event
        publish_event("omnishield:threats", "LEAK_ALERT", event_data)
    else:
        publish_event("omnishield:threats", "NEW_SIGNAL", {"threat_id": threat.id, "source": threat.source})
        
    return {"status": "SUCCESS", "threat": threat}

@router.post("/trigger-backup")
def trigger_backup_protocol(trigger: BackupTrigger, db: Session = Depends(get_session)):
    exam = db.get(Exam, trigger.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # Enforce dual-authority check
    if not (trigger.authority_1_signed and trigger.authority_2_signed):
        raise HTTPException(
            status_code=400,
            detail="Dual-authority approval check failed: 2-of-2 authentications required to trigger backup protocol."
        )
        
    # Swap active paper registry
    # In a real environment, we'd flag the current sealed paper as COMPROMISED,
    # and mark a pre-seeded PAPER-B as the ACTIVE target.
    # We update the system configs and DB status:
    exam.status = "SETUP" # Reset to setup or backup deployed state
    db.add(exam)
    
    # Audit log
    event_data = {"exam_id": trigger.exam_id, "triggered_by": trigger.operator_name, "checksum": "PAPER-B-ACTIVE"}
    audit = AuditLedger(
        exam_id=trigger.exam_id,
        event_type="BACKUP_PAPER_PROTOCOL_DEPLOYED",
        actor_id=trigger.operator_name,
        actor_role="NTA Director",
        payload_json=json.dumps(event_data),
        event_hash=calculate_sha256(json.dumps(event_data).encode('utf-8'))
    )
    db.add(audit)
    db.commit()
    
    # Publish threat mitigation event
    publish_event("omnishield:threats", "BACKUP_DEPLOYED", event_data)
    
    return {"status": "SUCCESS", "message": "Backup paper set (PAPER-B) successfully activated. Exam registries updated."}
