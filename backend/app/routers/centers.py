import json
import base64
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session, ExamCenter, AuditLedger, QuestionPaper, Question, PaperQuestionLink, Candidate
from app.redis_client import publish_event, increment_live_counter
from app.security_utils import verify_rsa_signature, calculate_sha256
from app.watermarking import embed_watermark_in_pdf

router = APIRouter()

class DownloadRequest(BaseModel):
    center_id: int
    signature: str # RSA signature of center_id + timestamp
    timestamp: str

@router.get("")
def list_centers(exam_id: Optional[int] = None, db: Session = Depends(get_session)):
    stmt = select(ExamCenter)
    return db.exec(stmt).all()

@router.get("/{id}")
def get_center(id: int, db: Session = Depends(get_session)):
    center = db.get(ExamCenter, id)
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")
    return center

@router.post("/download/{centerId}")
def download_exam_paper(
    centerId: int,
    req: DownloadRequest,
    db: Session = Depends(get_session)
):
    center = db.get(ExamCenter, centerId)
    if not center:
        raise HTTPException(status_code=404, detail="Exam center registration not found")
        
    # Enforce one-time download rule
    if center.status in ["DOWNLOADED", "PRINTED"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN if 'status' in globals() else 403,
            detail="Forbidden: Question paper booklet already downloaded for this exam center. Re-download requires SuperAdmin override token."
        )
        
    # Verify RSA Public Key signature
    # In a full run, center signs its download request using its private key
    # If no key is seeded, we verify signature validation:
    # To facilitate local hackathon demo without heavy key files:
    if center.rsapub_key:
        verification_data = f"{centerId}:{req.timestamp}".encode('utf-8')
        is_valid = verify_rsa_signature(center.rsapub_key, verification_data, req.signature)
        if not is_valid:
            # Audit log failure
            event_data = {"center_id": centerId, "reason": "RSA public key signature verification failed."}
            audit = AuditLedger(
                exam_id=None,
                event_type="UNAUTHORIZED_DOWNLOAD_ATTEMPT",
                actor_id=center.operator_id,
                actor_role="Center Operator",
                payload_json=json.dumps(event_data),
                event_hash=calculate_sha256(json.dumps(event_data).encode('utf-8'))
            )
            db.add(audit)
            db.commit()
            raise HTTPException(status_code=401, detail="Unauthorized: Cryptographic RSA signature check failed.")

    # Find the active sealed paper
    # For NEET, active exam = 1. Let's find first sealed paper
    paper = db.exec(select(QuestionPaper).where(QuestionPaper.status == "SEALED")).first()
    if not paper:
        raise HTTPException(status_code=404, detail="No sealed question paper found for distribution.")
        
    # Assemble PDF paper buffer (or simulated booklet buffer)
    raw_pdf_content = b"OMNISHIELD SECURED EXAM BOOKLET PDF BUFFER. " * 50
    
    # Apply DWT-SVD Watermark for this center's candidate batch
    # In Celery/background: embeds center code and candidate ID into PDF
    watermarked_pdf = embed_watermark_in_pdf(raw_pdf_content, center.name[:4].upper(), f"BATCH_{centerId}")
    
    # Calculate checksum of serve blob
    download_hash = calculate_sha256(watermarked_pdf)
    
    # Update center download details
    center.status = "DOWNLOADED"
    center.download_at = datetime.utcnow()
    center.download_hash = download_hash
    db.add(center)
    
    # Audit log entry
    event_data = {"center_id": centerId, "hash": download_hash, "file_size": len(watermarked_pdf)}
    audit = AuditLedger(
        exam_id=paper.exam_id,
        event_type="CENTER_DOWNLOADED_PAPER",
        actor_id=center.operator_id,
        actor_role="Center Operator",
        payload_json=json.dumps(event_data),
        event_hash=calculate_sha256(json.dumps(event_data).encode('utf-8'))
    )
    db.add(audit)
    db.commit()
    
    # Publish counter increments
    increment_live_counter("papers_downloaded")
    
    # Broadcaster to NTA Admin grid
    publish_event("omnishield:centers", "CENTER_DOWNLOAD_SUCCESS", {
        "center_id": center.id,
        "name": center.name,
        "city": center.city,
        "download_at": center.download_at.isoformat(),
        "status": "DOWNLOADED"
    })
    
    # Return file content base64 encoded or dynamic download URL
    # For this API, we return b64 data + hash
    pdf_b64 = base64.b64encode(watermarked_pdf).decode('utf-8')
    return {
        "status": "SUCCESS",
        "center_code": center.operator_id,
        "hash": download_hash,
        "pdf_base64": pdf_b64,
        "expires_in_minutes": 10
    }

@router.post("/{id}/checkin")
def candidate_checkin(id: int, roll_number: str, present: bool, db: Session = Depends(get_session)):
    candidate = db.exec(select(Candidate).where(Candidate.roll_number == roll_number)).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    candidate.status = "CHECKED_IN" if present else "ABSENT"
    db.add(candidate)
    db.commit()
    
    # If checked in, decrease / increase counters
    if present:
        increment_live_counter("candidates_logged_in")
    else:
        increment_live_counter("candidates_absent")
        
    # Broadcast checkin
    publish_event("omnishield:candidates", "CANDIDATE_CHECKIN", {
        "roll_number": roll_number,
        "center_id": id,
        "present": present
    })
    
    return {"status": "SUCCESS", "candidate_status": candidate.status}
