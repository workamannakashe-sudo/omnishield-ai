import os
import json
import asyncio
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.database import init_db, get_session, ExamType, Exam, Question, ExamCenter, Threat, AuditLedger, SystemConfig
from app.redis_client import redis_client, redis_active, publish_event
from app.security_utils import calculate_sha256

# Import routers (to be created next)
from app.routers import exams, questions, papers, centers, threats, proctor, forensics

app = FastAPI(title="OmniShield AI - Exam Security API", version="2.0.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(exams.router, prefix="/api/exams", tags=["Exams"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(papers.router, prefix="/api/papers", tags=["Papers"])
app.include_router(centers.router, prefix="/api/centers", tags=["Centers"])
app.include_router(threats.router, prefix="/api/threats", tags=["Threats"])
app.include_router(proctor.router, prefix="/api/proctor", tags=["Proctoring"])
app.include_router(forensics.router, prefix="/api/forensics", tags=["Forensics & Audit"])

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
                # Connection might be closed already
                pass

manager = ConnectionManager()

# Background Redis pub/sub listener
async def redis_listener():
    """
    Subscribes to all omnishield channels and broadcasts incoming payloads
    to all active WebSockets.
    """
    if not redis_active:
        # If Redis is down, we run a simulator task to stream logs periodically
        print("Redis is down. Launching offline simulation broadcast thread.")
        logs_pool = [
            ("SYSTEM_LOG", {"type": "info", "message": "Database replication health check: OK."}),
            ("SERVER_HEARTBEAT", {"id": 1, "city": "Mumbai", "status": "ONLINE"}),
            ("THREAT_SIGNAL", {"source": "Telegram @leak_channel", "snippet": "Exam leaks update...", "similarity": 12.0}),
            ("SYSTEM_LOG", {"type": "system", "message": "Scout Agent: Checked Telegram forums. Nominal."})
        ]
        while True:
            await asyncio.sleep(6.0)
            if manager.active_connections:
                event_type, payload = asyncio.get_event_loop().run_in_executor(None, lambda: logs_pool[asyncio.get_event_loop().time() % len(logs_pool)])
                event_type, payload = logs_pool[int(asyncio.get_event_loop().time()) % len(logs_pool)]
                msg = json.dumps({"event": event_type, "data": payload})
                await manager.broadcast(msg)
        return

    # Real Redis pub/sub subscription
    pubsub = redis_client.pubsub()
    pubsub.psubscribe("omnishield:*")
    print("Subscribed to omnishield:* channels.")
    
    while True:
        try:
            # Non-blocking get message
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
        # Keep connection open and listen for incoming messages (e.g. chat, commands)
        while True:
            data = await websocket.receive_text()
            # Handle incoming client socket messages if needed
            print(f"Received WS message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    # Initialize DB
    init_db()
    
    # Seed default data
    seed_database()
    
    # Spawn Redis listener task
    asyncio.create_task(redis_listener())

def seed_database():
    """
    Seed initial exam types, admins, and configs if empty.
    """
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
    
    # 4. Seed centers
    centers_list = [
        ExamCenter(name="Delhi Technical Institute", city="Delhi", state="Delhi", student_count=250, operator_id="operator_delhi", status="LOCKED"),
        ExamCenter(name="Mumbai Academy of Science", city="Mumbai", state="Maharashtra", student_count=180, operator_id="operator_mumbai", status="LOCKED"),
        ExamCenter(name="Bangalore Central School", city="Bangalore", state="Karnataka", student_count=300, operator_id="operator_bangalore", status="LOCKED"),
        ExamCenter(name="Kolkata Engineering College", city="Kolkata", state="West Bengal", student_count=150, operator_id="operator_kolkata", status="LOCKED"),
        ExamCenter(name="Jaipur High School", city="Jaipur", state="Rajasthan", student_count=120, operator_id="operator_jaipur", status="LOCKED"),
    ]
    for center in centers_list:
        db_session.add(center)
    db_session.commit()
    
    # 5. Seed some threats
    threats_list = [
        Threat(exam_id=active_exam.id, source="Telegram @leak_channel_2026", snippet="NEET biology answer sheet leaked...", similarity_score=14.2, verdict="FAKE"),
        Threat(exam_id=active_exam.id, source="Dark Web Forum", snippet="NEET 2026 Physics complete question paper download link...", similarity_score=44.1, verdict="ANALYSING"),
        Threat(exam_id=active_exam.id, source="Twitter #NEETLeaks", snippet="Leak warning, check coaching question bank...", similarity_score=9.1, verdict="FAKE")
    ]
    for t in threats_list:
        db_session.add(t)
    db_session.commit()
    
    # 6. Seed questions
    q1_text = json.dumps({"en": "Analyze the ribosomal subunit configuration during eukaryotic translation initiation phase."})
    q1_options = json.dumps({"en": {"A": "40S and 60S subunit scanning", "B": "30S and 50S prokaryotic binding", "C": "80S direct initiation bypass", "D": "70S mono-cistronic translation"}})
    q1_hash = calculate_sha256(q1_text.encode('utf-8'))
    
    q2_text = json.dumps({"en": "Calculate the magnetic flux density at the center of a circular current carrying loop of radius R."})
    q2_options = json.dumps({"en": {"A": "μ0 I / (2R)", "B": "μ0 I / (4πR)", "C": "μ0 I R^2", "D": "Zero"}})
    q2_hash = calculate_sha256(q2_text.encode('utf-8'))
    
    questions_list = [
        Question(exam_type_id=neet_type.id, text_json=q1_text, options_json=q1_options, answer="A", subject="Biology", chapter="Genetics", topic="Translation", bloom_level="L4 Analyse", difficulty="Hard", question_type="MCQ_single", audit_hash=q1_hash, status="APPROVED"),
        Question(exam_type_id=neet_type.id, text_json=q2_text, options_json=q2_options, answer="A", subject="Physics", chapter="Electromagnetism", topic="Magnetic Fields", bloom_level="L3 Apply", difficulty="Medium", question_type="MCQ_single", audit_hash=q2_hash, status="APPROVED"),
    ]
    for q in questions_list:
        db_session.add(q)
    db_session.commit()
    print("Database seeding completed successfully.")
