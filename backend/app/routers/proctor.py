import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session, ProctorAlert, Candidate, AuditLedger
from app.redis_client import publish_event, increment_live_counter
from app.security_utils import calculate_sha256

router = APIRouter()

class FlagRequest(BaseModel):
    alert_type: str
    severity: str
    snapshot_url: Optional[str] = None
    reason: str

@router.get("/alerts")
def get_proctor_alerts(exam_id: int, severity: Optional[str] = None, db: Session = Depends(get_session)):
    stmt = select(ProctorAlert).where(ProctorAlert.exam_id == exam_id)
    if severity:
        stmt = stmt.where(ProctorAlert.severity == severity)
    return db.exec(stmt).all()

@router.post("/flag/{candidateId}")
def flag_candidate(
    candidateId: int,
    req: FlagRequest,
    db: Session = Depends(get_session)
):
    candidate = db.get(Candidate, candidateId)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    alert = ProctorAlert(
        exam_id=candidate.exam_id,
        candidate_id=candidateId,
        alert_type=req.alert_type,
        severity=req.severity,
        snapshot_url=req.snapshot_url
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    # Update count
    increment_live_counter("proctoring_alerts")
    
    # Publish to Redis
    event_data = {
        "alert_id": alert.id,
        "roll_number": candidate.roll_number,
        "name": candidate.name,
        "alert_type": alert.alert_type,
        "severity": alert.severity,
        "reason": req.reason
    }
    publish_event("omnishield:proctor", "AI_ALERT_TRIGGERED", event_data)
    
    return {"status": "SUCCESS", "alert": alert}

@router.post("/terminate/{candidateId}")
def terminate_candidate_session(candidateId: int, operator_name: str, db: Session = Depends(get_session)):
    candidate = db.get(Candidate, candidateId)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    candidate.status = "ABSENT" # Set to absent / barred
    db.add(candidate)
    
    # Audit log
    event_data = {"candidate_id": candidateId, "roll_number": candidate.roll_number, "action": "TERMINATE"}
    audit = AuditLedger(
        exam_id=candidate.exam_id,
        event_type="CANDIDATE_SESSION_TERMINATED",
        actor_id=operator_name,
        actor_role="Invigilator",
        payload_json=json.dumps(event_data),
        event_hash=calculate_sha256(json.dumps(event_data).encode('utf-8'))
    )
    db.add(audit)
    db.commit()
    
    # Broadcast termination command to client app
    publish_event(f"omnishield:exam:{candidate.exam_id}", "TERMINATE_SESSION", {
        "roll_number": candidate.roll_number
    })
    
    return {"status": "SUCCESS", "message": f"Candidate {candidate.roll_number} session terminated."}
