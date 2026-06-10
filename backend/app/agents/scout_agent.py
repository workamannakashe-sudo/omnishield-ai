import os
import json
import asyncio
import random
from datetime import datetime
from sqlmodel import Session, select

from app.database import Threat, Exam, AuditLedger, get_session
from app.redis_client import publish_event, increment_live_counter
from app.security_utils import calculate_sha256
from app.agents.vector_agent import run_vector_agent

# Initialize Telethon if API ID/Hash is present
TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID")
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
TELEGRAM_SESSION = os.getenv("TELEGRAM_SESSION", "omnishield_scout")

async def get_telegram_messages() -> list:
    """
    Connects to Telegram using Telethon and returns recent message texts.
    Falls back to simulated OSINT sources if credentials aren't set.
    """
    messages = []
    if TELEGRAM_API_ID and TELEGRAM_API_HASH:
        try:
            from telethon import TelegramClient
            client = TelegramClient(TELEGRAM_SESSION, int(TELEGRAM_API_ID), TELEGRAM_API_HASH)
            await client.connect()
            if await client.is_user_authorized():
                # Scan public leak channels
                channels = ["@leak_neet2026", "@upsc_leaks", "@board_exam_helpers"]
                for chan in channels:
                    try:
                        async for msg in client.iter_messages(chan, limit=5):
                            if msg.text:
                                messages.append({"source": f"Telegram {chan}", "text": msg.text})
                    except Exception as ex:
                        print(f"Error reading channel {chan}: {ex}")
            await client.disconnect()
        except Exception as e:
            print(f"Telethon connection error: {e}")

    # Fallback simulation to scan OSINT forums
    if not messages:
        simulation_pool = [
            {"source": "Telegram @neet_leaks_direct", "text": "NEET 2026 Biology leaked question: ribosomal configuration scan phase..."},
            {"source": "DarkWeb SilkRoad v4", "text": "UPSC CSAT GS Paper I leak, download torrent with matching questions on economy..."},
            {"source": "Pastebin neet_helper", "text": "Check these leaked questions for physics: circular carrying loop magnetic field density..."},
            {"source": "Twitter #JEE2026Leaks", "text": "Coaching institute test series leaked matching actual engineering sheets..."},
        ]
        # Simulate scanning 1-2 random items
        messages = random.sample(simulation_pool, k=random.randint(1, 2))
        
    return messages

def evaluate_leak_probability(text: str) -> float:
    """
    Feeds the message content to an LLM to evaluate the leak probability.
    Falls back to regex keyword scoring if LLM is offline/no API key.
    """
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_core.output_parsers import JsonOutputParser
            
            model = ChatOpenAI(model="gpt-4o", temperature=0.1)
            prompt = ChatPromptTemplate.from_template(
                "You are a threat intelligence analyst specializing in exam paper leaks.\n"
                "Evaluate the probability that this scraped message contains actual leaked question paper content.\n"
                "Message Content: {content}\n"
                "Return a JSON response with:\n"
                "{{\n"
                "  \"probability\": 0.0-100.0,\n"
                "  \"reason\": \"Brief explanation\"\n"
                "}}"
            )
            chain = prompt | model | JsonOutputParser()
            res = chain.invoke({"content": text})
            return float(res.get("probability", 0.0))
        except Exception as e:
            print(f"LLM Threat Scoring failed: {e}")

    # Regex keyword scoring fallback
    keywords = ["leak", "direct copy", "answer sheet", "cheating", "blueprint", "actual question"]
    score = 10.0
    for kw in keywords:
        if kw in text.lower():
            score += 25.0
    return min(score + random.uniform(0, 15), 100.0)

async def scan_and_log_threats():
    """
    Runs Scout agent as a threat scanner cycle.
    """
    db = next(get_session())
    
    # 1. Fetch active exam
    exam = db.exec(select(Exam).where(Exam.status == "SETUP")).first()
    exam_id = exam.id if exam else 1
    
    messages = await get_telegram_messages()
    
    for msg in messages:
        text = msg["text"]
        source = msg["source"]
        
        # 2. LLM Probability Scoring
        prob_score = evaluate_leak_probability(text)
        
        # 3. ChromaDB Vector Similarity check against active questions
        # Uses vector_agent checks
        vector_res = run_vector_agent(text)
        similarity = vector_res.get("similarity_score", 0.0) * 100.0
        
        # Threat is considered CRITICAL if probability or similarity is high
        # Or if keywords strongly match
        is_critical = (prob_score > 70.0) or (similarity > 70.0)
        
        verdict = "CRITICAL" if is_critical else "ANALYSING"
        if similarity > 85.0:
            verdict = "CRITICAL"
        
        # Save Threat to DB
        threat = Threat(
            exam_id=exam_id,
            source=source,
            snippet=text[:500],
            similarity_score=round(similarity, 2),
            verdict=verdict
        )
        db.add(threat)
        db.commit()
        db.refresh(threat)
        
        # Publish alerts if critical
        if verdict == "CRITICAL":
            increment_live_counter("active_threats")
            event_data = {"threat_id": threat.id, "score": threat.similarity_score, "source": threat.source, "snippet": threat.snippet}
            
            # Log to audit ledger
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
            
            # Publish WS / Redis alert
            publish_event("omnishield:threats", "LEAK_ALERT", event_data)
        else:
            publish_event("omnishield:threats", "NEW_SIGNAL", {"threat_id": threat.id, "source": threat.source})

def run_scout_sync():
    """Sync wrapper to run inside Celery workers"""
    asyncio.run(scan_and_log_threats())
