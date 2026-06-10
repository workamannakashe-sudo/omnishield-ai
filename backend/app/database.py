import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, create_engine, Session, select, Relationship
from sqlalchemy import event

# Database connection URL. Default to PostgreSQL, fallback to SQLite for local development ease.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/omnishield")

# If using sqlite, connect with thread sharing
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Postgres engine
    engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20)

# Models Definition
class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    role: str  # SuperAdmin, ExamBoard, Center, Invigilator, Candidate
    center_id: Optional[int] = Field(default=None, foreign_key="exam_centers.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ExamType(SQLModel, table=True):
    __tablename__ = "exam_types"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    category: str
    default_config_json: str = Field(default="{}")  # Stores default marking, language, sections rules

class Exam(SQLModel, table=True):
    __tablename__ = "exams"
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_type_id: int = Field(foreign_key="exam_types.id")
    name: str = Field(index=True)
    date: str  # Format: YYYY-MM-DD
    shift: str  # Morning / Afternoon / Evening
    duration: int  # minutes
    status: str = Field(default="SETUP")  # SETUP, SEALED, DISTRIBUTED, LIVE, SUBMITTED, RESULTS
    security_level: str = Field(default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    config_json: str = Field(default="{}")  # Custom rules, languages, section rules
    created_by: str = Field(default="admin")
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class Question(SQLModel, table=True):
    __tablename__ = "questions"
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_type_id: int = Field(foreign_key="exam_types.id", index=True)
    text_json: str  # JSON map of languages: {"en": "Text", "hi": "Text"}
    options_json: str  # JSON map of options: {"en": {"A": "", "B": ""}, "hi": {"A": "", "B": ""}}
    answer: str  # Correct answer symbol (e.g. "B" or "A,C" or "15")
    subject: str = Field(index=True)
    chapter: str
    topic: str
    bloom_level: str  # L1, L2, L3, L4, L5, L6
    difficulty: str  # Easy, Medium, Hard, Very Hard
    question_type: str  # MCQ_single, MCQ_multiple, Numerical, Column_match, passage, descriptive etc.
    source: str = Field(default="Synthetic")  # Synthetic / Human-authored / OCR-extracted
    audit_hash: str
    status: str = Field(default="PENDING")  # PENDING, APPROVED, DISCARDED, FLAGGED
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class QuestionPaper(SQLModel, table=True):
    __tablename__ = "question_papers"
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: int = Field(foreign_key="exams.id", index=True)
    name: str
    status: str = Field(default="DRAFT")  # DRAFT, SEALED
    sealed_at: Optional[datetime] = Field(default=None)
    sealed_by: Optional[str] = Field(default=None)
    encrypted_blob_url: Optional[str] = Field(default=None)
    paper_hash: Optional[str] = Field(default=None)
    set_code: str = Field(default="A")  # Set A, B, C, D

class PaperQuestionLink(SQLModel, table=True):
    __tablename__ = "paper_questions"
    paper_id: int = Field(foreign_key="question_papers.id", primary_key=True)
    question_id: int = Field(foreign_key="questions.id", primary_key=True)
    order_index: int
    section: str = Field(default="Section A")

class Candidate(SQLModel, table=True):
    __tablename__ = "candidates"
    id: Optional[int] = Field(default=None, primary_key=True)
    roll_number: str = Field(index=True, unique=True)
    name: str
    exam_id: int = Field(foreign_key="exams.id", index=True)
    center_id: Optional[int] = Field(default=None, foreign_key="exam_centers.id", index=True)
    category: str = Field(default="GEN")  # GEN, OBC, SC, ST, EWS, PwD
    photo_url: Optional[str] = Field(default=None)
    q_order_seed: int = Field(default=42)  # Deterministic seed for question shuffling
    admit_card_url: Optional[str] = Field(default=None)
    status: str = Field(default="REGISTERED")  # REGISTERED, CHECKED_IN, SUBMITTED, ABSENT
    special_needs_json: str = Field(default="{}")  # extra time, scribe etc.

class ExamCenter(SQLModel, table=True):
    __tablename__ = "exam_centers"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    city: str = Field(index=True)
    state: str = Field(index=True)
    student_count: int = Field(default=0)
    operator_id: str = Field(index=True)
    status: str = Field(default="LOCKED")  # LOCKED, UNLOCKED, DOWNLOADED, PRINTED, ERROR
    download_at: Optional[datetime] = Field(default=None)
    download_hash: Optional[str] = Field(default=None)
    rsapub_key: str = Field(default="")  # PEM encoded RSA-2048 public key
    last_heartbeat: Optional[datetime] = Field(default=None)

class Threat(SQLModel, table=True):
    __tablename__ = "threats"
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: int = Field(foreign_key="exams.id", index=True)
    source: str = Field(index=True)  # Telegram / Twitter / Dark web / Manual
    snippet: str
    similarity_score: float = Field(default=0.0)
    verdict: str = Field(default="ANALYSING")  # ANALYSING, FAKE, CRITICAL, DIVERTED
    resolved_by: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class AuditLedger(SQLModel, table=True):
    __tablename__ = "audit_ledger"
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: Optional[int] = Field(default=None, index=True)
    event_type: str = Field(index=True)  # QUESTION_APPROVED, PAPER_SEALED, etc.
    actor_id: str
    actor_role: str
    payload_json: str = Field(default="{}")
    event_hash: str
    ip_address: str = Field(default="127.0.0.1")
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class ProctorAlert(SQLModel, table=True):
    __tablename__ = "proctor_alerts"
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: int = Field(foreign_key="exams.id", index=True)
    candidate_id: int = Field(foreign_key="candidates.id", index=True)
    alert_type: str = Field(index=True)  # NO_FACE, MULTIPLE_FACES, TAB_SWITCH, LOOKING_AWAY
    severity: str = Field(default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    snapshot_url: Optional[str] = Field(default=None)
    resolved: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class ExamSchedule(SQLModel, table=True):
    __tablename__ = "exam_schedule"
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: int = Field(foreign_key="exams.id", unique=True, index=True)
    exam_date: str
    unlock_time: str
    distribution_start: str
    current_step: int = Field(default=1)
    step_states_json: str = Field(default="{}")

class SystemConfig(SQLModel, table=True):
    __tablename__ = "system_config"
    key: str = Field(primary_key=True)
    value: str
    updated_by: str = Field(default="system")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class IncidentReport(SQLModel, table=True):
    __tablename__ = "incident_reports"
    id: Optional[int] = Field(default=None, primary_key=True)
    center_id: int = Field(foreign_key="exam_centers.id", index=True)
    exam_id: int = Field(foreign_key="exams.id", index=True)
    reported_by: str
    description: str
    severity: str = Field(default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status: str = Field(default="NEW")  # NEW, RESOLVED
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

# Upload Paper System tables
class UploadedPaper(SQLModel, table=True):
    __tablename__ = "uploaded_papers"
    id: Optional[int] = Field(default=None, primary_key=True)
    original_filename: str
    file_url: str
    file_type: str  # pdf, docx, csv, txt, zip, doc_link
    exam_type_id: int = Field(foreign_key="exam_types.id", index=True)
    year: int
    shift: str
    source_type: str  # PYP, Mock, Coaching, University, Custom
    language: str  # e.g. English, Hindi, Bilingual
    marking_scheme_json: str = Field(default="{}")
    upload_purpose: str = Field(default="Import to Bank")  # Import to Bank / Archive / Template
    status: str = Field(default="PROCESSING")  # PROCESSING, STAGED, IMPORTED, ERROR
    extraction_task_id: Optional[str] = Field(default=None)
    total_extracted: int = Field(default=0)
    total_imported: int = Field(default=0)
    total_skipped: int = Field(default=0)
    quality_score: int = Field(default=100)
    uploaded_by: str = Field(default="admin")
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class ExtractedQuestionStaging(SQLModel, table=True):
    __tablename__ = "extracted_questions_staging"
    id: Optional[int] = Field(default=None, primary_key=True)
    paper_id: int = Field(foreign_key="uploaded_papers.id", index=True)
    q_number: int
    q_type: str  # MCQ_single, etc.
    text_json: str
    options_json: str
    correct_answer: str
    has_diagram: bool = Field(default=False)
    diagram_url: Optional[str] = Field(default=None)
    confidence_score: float = Field(default=1.0)  # 0.0 - 1.0 confidence from parser
    ocr_raw_text: str = Field(default="")
    page_number: int = Field(default=1)
    review_status: str = Field(default="UNREVIEWED")  # UNREVIEWED, APPROVED, SKIPPED, EDITED
    reviewed_by: Optional[str] = Field(default=None)
    final_question_id: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class QuestionDraft(SQLModel, table=True):
    __tablename__ = "question_drafts"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    q_type: str
    text_json: str
    options_json: str
    correct_answer: str
    metadata_json: str = Field(default="{}")
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class AnswerKey(SQLModel, table=True):
    __tablename__ = "answer_keys"
    id: Optional[int] = Field(default=None, primary_key=True)
    paper_id: int = Field(foreign_key="uploaded_papers.id", index=True)
    file_url: str
    answers_json: str  # {"1": "A", "2": "C"}
    uploaded_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


# SQLAlchemy Listeners to Enforce Append-Only for AuditLedger
@event.listens_for(AuditLedger, 'before_update')
def receive_before_update(mapper, connection, target):
    raise PermissionError("Updates are strictly prohibited on append-only audit_ledger table.")

@event.listens_for(AuditLedger, 'before_delete')
def receive_before_delete(mapper, connection, target):
    raise PermissionError("Deletions are strictly prohibited on append-only audit_ledger table.")


def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
