import os
import json
import asyncio
import time
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.database import init_db, get_session, ExamType, Exam, Question, ExamCenter, Threat, AuditLedger, SystemConfig, User, Candidate
from app.redis_client import redis_client, redis_active, publish_event
from app.security_utils import calculate_sha256

# Import routers
from app.routers import exams, questions, papers, centers, threats, proctor, forensics, auth, watermark

app = FastAPI(title="OmniShield AI - Exam Security API", version="2.0.0")

# CORS Setup
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Rate Limiting Middleware
@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    path = request.url.path
    if path.startswith("/api/auth") or "/download" in path:
        client_ip = request.client.host if request.client else "127.0.0.1"
        key = f"ratelimit:{client_ip}:{path}"
        try:
            current = redis_client.get(key)
            if current and int(current) >= 60:  # Limit to 60 requests per minute
                return Response(
                    content=json.dumps({"detail": "Rate limit exceeded. Too many requests."}),
                    status_code=429,
                    media_type="application/json"
                )
            
            if not current:
                redis_client.set(key, 1, ex=60)
            else:
                redis_client.incrby(key, 1)
        except Exception:
            pass  # Fallback gracefully if Redis is unresponsive
            
    return await call_next(request)

# 2. CSRF Protection Middleware
@app.middleware("http")
async def csrf_protection_middleware(request: Request, call_next):
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        path = request.url.path
        # Exclude webhooks, websockets, and public auth endpoints
        if not path.startswith("/api/watermark") and not path.startswith("/ws") and not path.startswith("/api/auth"):
            origin = request.headers.get("origin")
            referer = request.headers.get("referer")
            host = request.headers.get("host")
            
            # Restrict requests to originating from the same host, or requiring API Auth Token / CSRF header
            has_csrf = request.headers.get("x-csrf-token") is not None
            has_auth = request.headers.get("authorization") is not None
            
            if not (has_csrf or has_auth or (origin and host in origin) or (referer and host in referer)):
                return Response(
                    content=json.dumps({"detail": "CSRF validation failed: missing custom authorization/CSRF header or invalid origin."}),
                    status_code=403,
                    media_type="application/json"
                )
    return await call_next(request)


# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(exams.router, prefix="/api/exams", tags=["Exams"])
app.include_router(exams.router, prefix="/api/exam", tags=["Exams"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(papers.router, prefix="/api/papers", tags=["Papers"])
app.include_router(centers.router, prefix="/api/centers", tags=["Centers"])
app.include_router(threats.router, prefix="/api/threats", tags=["Threats"])
app.include_router(proctor.router, prefix="/api/proctor", tags=["Proctoring"])
app.include_router(forensics.router, prefix="/api/forensics", tags=["Forensics & Audit"])
app.include_router(watermark.router, prefix="/api/watermark", tags=["Watermarking"])


# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

# Background Redis pub/sub listener
async def redis_listener():
    if not redis_active:
        print("Redis is down. Launching simulation log thread.")
        logs_pool = [
            ("SYSTEM_LOG", {"type": "info", "message": "Database replication health check: OK."}),
            ("SERVER_HEARTBEAT", {"id": 1, "city": "Mumbai", "status": "ONLINE"}),
            ("THREAT_SIGNAL", {"source": "Telegram @leak_channel", "snippet": "Exam leaks update...", "similarity": 12.0}),
            ("SYSTEM_LOG", {"type": "system", "message": "Scout Agent: Checked Telegram forums. Nominal."})
        ]
        while True:
            await asyncio.sleep(6.0)
            if manager.active_connections:
                event_type, payload = logs_pool[int(time.time()) % len(logs_pool)]
                msg = json.dumps({"event": event_type, "data": payload})
                await manager.broadcast(msg)
        return

    pubsub = redis_client.pubsub()
    pubsub.psubscribe("omnishield:*")
    print("Subscribed to omnishield:* channels.")
    
    while True:
        try:
            message = pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
            if message:
                payload = message.get("data")
                if payload:
                    await manager.broadcast(payload)
            await asyncio.sleep(0.05)
        except Exception as e:
            print(f"Error in Redis pub/sub listener: {e}")
            await asyncio.sleep(1.0)

# Websocket endpoint
@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received WS message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    init_db()
    seed_database()
    asyncio.create_task(redis_listener())

def seed_database():
    db_session = next(get_session())
    
    # Check if seeded
    existing = db_session.exec(select(ExamType)).first()
    if existing:
        return
        
    print("Seeding initial database entries...")
    # 1. Seed Exam Types
    exam_types = [
        ExamType(name="NEET UG", category="Medical entrance", default_config_json=json.dumps({"sections": [{"name": "Biology", "count": 90}, {"name": "Physics", "count": 45}, {"name": "Chemistry", "count": 45}]})),
        ExamType(name="JEE Main", category="Engineering entrance", default_config_json=json.dumps({"sections": [{"name": "Physics", "count": 30}, {"name": "Chemistry", "count": 30}, {"name": "Maths", "count": 30}]})),
        ExamType(name="UPSC CSE", category="Civil services", default_config_json=json.dumps({"sections": [{"name": "GS Paper I", "count": 100}]})),
        ExamType(name="IBPS PO", category="Banking", default_config_json=json.dumps({"sections": [{"name": "Quantitative", "count": 35}, {"name": "Reasoning", "count": 35}, {"name": "English", "count": 30}]})),
        ExamType(name="CAT", category="MBA", default_config_json=json.dumps({"sections": [{"name": "VARC", "count": 24}, {"name": "DILR", "count": 20}, {"name": "QA", "count": 22}]}))
    ]
    for et in exam_types:
        db_session.add(et)
    db_session.commit()
    
    # 2. Seed System configs
    configs = [
        SystemConfig(key="similarity_threshold", value="0.85"),
        SystemConfig(key="default_watermark_params", value=json.dumps({"alpha": 0.05, "level": 2})),
        SystemConfig(key="encryption_algorithm", value="AES-256-GCM")
    ]
    for c in configs:
        db_session.add(c)
        
    # 3. Seed an active exam
    neet_type = db_session.exec(select(ExamType).where(ExamType.name == "NEET UG")).first()
    active_exam = Exam(
        exam_type_id=neet_type.id,
        name="NEET UG Entrance 2026",
        date="2026-06-14",
        shift="Morning",
        duration=180,
        status="SETUP",
        security_level="CRITICAL",
        config_json=json.dumps({
            "attempt_rule": "attempt all",
            "proctoring": "full",
            "calculator": "no"
        })
    )
    db_session.add(active_exam)
    db_session.commit()
    
    # 4. Seed users & centers
    # 5 demo logins: SuperAdmin, ExamBoard, Center, Invigilator, Candidate
    # We will generate hash dynamically using bcrypt
    admin_pw = bcrypt_hash("admin123")
    board_pw = bcrypt_hash("board123")
    center_pw = bcrypt_hash("center123")
    invig_pw = bcrypt_hash("invig123")
    cand_pw = bcrypt_hash("candidate123")

    users_list = [
        User(username="superadmin", password_hash=admin_pw, role="SuperAdmin"),
        User(username="board_admin", password_hash=board_pw, role="ExamBoard"),
        User(username="invigilator1", password_hash=invig_pw, role="Invigilator"),
        User(username="ROLL#2024001", password_hash=cand_pw, role="Candidate"),
    ]
    for u in users_list:
        db_session.add(u)
    db_session.commit()

    # Bulk insert 5000 centers
    print("Bulk seeding 5000 centers...")
    centers_to_add = []
    # Seed specific named ones first
    named_centers = [
        ("Delhi Technical Institute", "Delhi", "Delhi", "operator_delhi"),
        ("Mumbai Academy of Science", "Mumbai", "Maharashtra", "operator_mumbai"),
        ("Bangalore Central School", "Bangalore", "Karnataka", "operator_bangalore"),
        ("Kolkata Engineering College", "Kolkata", "West Bengal", "operator_kolkata"),
        ("Jaipur High School", "Jaipur", "Rajasthan", "operator_jaipur"),
    ]
    
    # Add operator accounts for named ones
    for i, (name, city, state, op_id) in enumerate(named_centers):
        op_user = User(username=op_id, password_hash=center_pw, role="Center", center_id=i+1)
        db_session.add(op_user)
        c = ExamCenter(name=name, city=city, state=state, student_count=100 + (i * 50), operator_id=op_id, status="LOCKED")
        db_session.add(c)
    db_session.commit()

    # Fill rest up to 5000 centers
    for i in range(len(named_centers) + 1, 5001):
        c_name = f"Exam Center #{i}"
        city = f"City {i % 100}"
        state = f"State {i % 28}"
        op_id = f"operator_{i}"
        
        c = ExamCenter(name=c_name, city=city, state=state, student_count=150, operator_id=op_id, status="LOCKED")
        centers_to_add.append(c)
        
        # Batch insert in chunks of 1000
        if len(centers_to_add) >= 1000:
            db_session.bulk_save_objects(centers_to_add)
            db_session.commit()
            centers_to_add = []
            
    if centers_to_add:
        db_session.bulk_save_objects(centers_to_add)
        db_session.commit()

    # 5. Seed 4872 questions
    print("Bulk seeding 4872 questions...")
    q1_text = json.dumps({"en": "Analyze the ribosomal subunit configuration during eukaryotic translation initiation phase."})
    q1_options = json.dumps({"en": {"A": "40S and 60S subunit scanning", "B": "30S and 50S prokaryotic binding", "C": "80S direct initiation bypass", "D": "70S mono-cistronic translation"}})
    q1_hash = calculate_sha256(q1_text.encode('utf-8'))
    
    questions_to_add = []
    subjects = ["Biology", "Physics", "Chemistry"]
    difficulties = ["Easy", "Medium", "Hard", "Very Hard"]
    blooms = ["L1 Remember", "L2 Understand", "L3 Apply", "L4 Analyse", "L5 Evaluate"]
    
    for i in range(1, 4873):
        subj = subjects[i % len(subjects)]
        diff = difficulties[i % len(difficulties)]
        bl = blooms[i % len(blooms)]
        text = f"Synthetic question #{i}: Assess {subj} concepts using Cognitive Load {bl} at difficulty {diff}."
        
        q = Question(
            exam_type_id=neet_type.id,
            text_json=json.dumps({"en": text}),
            options_json=json.dumps({"en": {"A": "Option Alpha", "B": "Option Beta", "C": "Option Gamma", "D": "Option Delta"}}),
            answer="A",
            subject=subj,
            chapter=f"Chapter {i % 10}",
            topic=f"Topic {i % 20}",
            bloom_level=bl,
            difficulty=diff,
            question_type="MCQ_single",
            audit_hash=calculate_sha256(text.encode('utf-8')),
            status="APPROVED"
        )
        questions_to_add.append(q)
        
        if len(questions_to_add) >= 1000:
            db_session.bulk_save_objects(questions_to_add)
            db_session.commit()
            questions_to_add = []
            
    if questions_to_add:
        db_session.bulk_save_objects(questions_to_add)
        db_session.commit()

    # 6. Seed some threats
    threats_list = [
        Threat(exam_id=active_exam.id, source="Telegram @leak_channel_2026", snippet="NEET biology answer sheet leaked...", similarity_score=14.2, verdict="FAKE"),
        Threat(exam_id=active_exam.id, source="Dark Web Forum", snippet="NEET 2026 Physics complete question paper download link...", similarity_score=44.1, verdict="ANALYSING"),
        Threat(exam_id=active_exam.id, source="Twitter #NEETLeaks", snippet="Leak warning, check coaching question bank...", similarity_score=9.1, verdict="FAKE")
    ]
    for t in threats_list:
        db_session.add(t)
    db_session.commit()
    
    # 7. Seed candidate count (We'll mock query counters to return 2.4M registered)
    # But we also add 5000 candidates for local center lookups
    print("Bulk seeding 5000 candidate records...")
    candidates_to_add = []
    for i in range(1, 5001):
        cand = Candidate(
            roll_number=f"ROLL#2026{i:04d}",
            name=f"Candidate {i}",
            exam_id=active_exam.id,
            center_id=(i % 5) + 1,  # Distributed over our 5 named centers
            category="GEN" if i % 10 != 0 else "PwD",
            status="REGISTERED",
            special_needs_json=json.dumps({"extra_time_minutes": 30, "scribe_assigned": True, "room_number": f"Room {i%20 + 1}"}) if i % 10 == 0 else "{}"
        )
        candidates_to_add.append(cand)
    db_session.bulk_save_objects(candidates_to_add)
    db_session.commit()
    
    print("Database seeding completed successfully.")

def bcrypt_hash(password: str) -> str:
    import bcrypt
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
