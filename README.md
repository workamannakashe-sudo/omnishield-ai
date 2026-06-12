<div align="center">

<img src="https://img.shields.io/badge/OmniShield-AI-00d4ff?style=for-the-badge&labelColor=0a0c10" alt="OmniShield AI"/>

# OmniShield AI
### Universal Exam Integrity & Control Platform

*Autonomous. Cryptographic. Unstoppable.*

[![Live Demo](https://img.shields.io/badge/▶%20Live%20Demo-omnishield--ai.vercel.app-00d4ff?style=for-the-badge&logo=vercel&logoColor=white)](https://omnishield-ai.vercel.app)

---

## The Crisis That Built OmniShield

On June 4, 2026, **NEET UG was cancelled for 2.27 million students.** A paper leaked from a printing facility in Jaipur — before a single student had opened a booklet. The re-examination cost the government **₹500+ Crore**.

The root cause is structural: question papers exist **for 72 hours** before exam day. Every hour they exist in physical form is an hour they can be photographed, forwarded, and sold.

> **OmniShield's answer: eliminate the window. Generate the paper 45 minutes before the exam starts. You cannot leak what does not exist yet.**

---

## What OmniShield Does

OmniShield is a **14-module autonomous operator platform** that secures national examinations across three phases — before, during, and after — with zero human touchpoints on the paper itself.

```
PHASE 1 — PRE-EXAM        PHASE 2 — EXAM DAY           PHASE 3 — POST-EXAM
─────────────────         ────────────────────         ───────────────────
Scout Agent          →    RAG Question Gen        →    Forensic Audit Agent
Verification Agent   →    Variation Agent         →    Z-Score Anomaly Map
Action Agent         →    Assembly Agent          →    Append-Only Ledger
                          DWT-SVD Watermark Agent
                          Exam Day State Machine
```

| Metric | Value |
|--------|-------|
| Students protected | 2.27 million (NEET scale) |
| Exam centres supported | 5,000 nodes |
| Watermarks generated | 240,000 per exam cycle |
| Leak window | **72 hours → 45 minutes** |
| Paper generation time | **< 45 seconds** |
| Threat detection time | **< 30 seconds** |

---

## Platform Screenshots

### Command Center
*Real-time overview: 4,872 questions banked, 5,000 edge servers online, active OSINT threat feed, live system log showing Scout Agent, Redis pub/sub, and PostgreSQL connections.*

![Command Center](<img width="1591" height="773" alt="om1" src="https://github.com/user-attachments/assets/83f354da-b1f3-4290-93d3-41abe52de269" />)

---

### Threat Intelligence — Scout Agent Feed
*Live OSINT monitoring across Telegram, Dark Web mirrors, and Twitter with similarity scores and FAKE/ANALYSING verdicts. Dual-Authority Verification Protocol requires simultaneous NTA Director + Chairman sign-off to trigger backup paper (PAPER-B).*

![Threat Intel](<img width="1595" height="777" alt="om5" src="https://github.com/user-attachments/assets/b52f12c9-bef3-4906-abfd-9fcab8d4c19e" />)

---

### Exam Day State Machine
*Six-phase autonomous pipeline: DISTRIBUTE → LOCK → BROADCAST\_TOKEN → UNLOCK → WATERMARK → GENERATE. Emergency operator controls available at every phase: Pause Exam, Extend Time (+15M), Full Abort.*

![Exam Day Control](<img width="1588" height="766" alt="om6" src="https://github.com/user-attachments/assets/c4392684-08c7-4f57-9c0d-38a5b8cbf47a" />)

---

### Paper Builder
*Drag-and-drop question assembly from approved bank with Biology/Physics/Chemistry difficulty tags. One-click SEAL PAPER triggers AES cryptographic lock on the assembled paper set.*

![Paper Builder](<img width="1593" height="771" alt="om3" src="https://github.com/user-attachments/assets/afe9dd8d-0976-4fbe-a385-c81158457e89" />)

---

### Candidate Control
*Bulk CSV import, auto-centre allocation, DWT-SVD compliant admit card generation. 240,000 unique watermarks generated across 5,000 centres for a single exam cycle.*

![Candidate Control](<img width="1592" height="774" alt="om4" src="https://github.com/user-attachments/assets/6d06dacd-6dc2-41e6-b42e-2b3d9ca0a5f0" />)

---

### Live Proctoring Dashboard
*WebRTC video feeds with MediaPipe landmark gaze detection. AI auto-proctor signals: CRITICAL (face not detected >30s), MEDIUM (tab swap detected). One-click broadcast message to all candidates.*

![Live Proctoring](<img width="1592" height="776" alt="om8" src="https://github.com/user-attachments/assets/3bb89689-e5e3-48a1-939a-d8adf1a64385" />)


---

### Forensics & Audit
*Forensic Roll Tracer backed by PostgreSQL append-only audit ledger. Every action — PAPER\_SEALED, EXAM\_CONFIG\_CREATED, CENTER\_KEY\_REGISTERED — logged with cryptographic hash, actor role, and timestamp. Tamper-proof by design.*

![Forensics & Audit](<img width="1592" height="774" alt="om11" src="https://github.com/user-attachments/assets/30e27c45-0fa2-4088-987c-4543adf92105" />)

---

###  AI Coordinator
*Embedded Claude API assistant grounded with live exam context: active threat level, centre download metrics, and exam metadata. Ask it anything about the current exam operational state.*

![AI Coordinator](<img width="1594" height="774" alt="om13" src="https://github.com/user-attachments/assets/78e3a7b0-17ae-4887-93cc-15972d7cb8be" />)

---

## Architecture

### Agent Pipeline (LangGraph)

```
OmniShieldState
│
├── SCOUT AGENT
│   └── Telethon OSINT → Telegram, Dark Web, Twitter monitoring
│   └── NLP keyword + structural fingerprint extraction
│
├── VERIFICATION AGENT
│   └── Cosine similarity (0.85 threshold) vs hashed exam blueprint
│   └── Never compares against actual questions
│
├── ACTION AGENT
│   └── Evidence package: source + timestamp + confidence score
│   └── Dual-Authority trigger: NTA Director + Chairman sign-off required
│   └── Fires backup paper generation pipeline autonomously
│
├── RAG GENERATION AGENT
│   └── FAISS vector retrieval + Claude API generation
│   └── Dual-agent validation loop (generate → verify factual accuracy)
│   └── Similarity filter: rejects >80% cosine match to coaching material
│
├── VARIATION AGENT
│   └── Surface variation per centre: numerics, MCQ order, phrasing
│   └── Self-solver check: Claude attempts question; discards if invalid
│
├── ASSEMBLY AGENT
│   └── 180-question paper assembled in <45 seconds
│   └── Topic distribution balance enforced automatically
│
├── WATERMARK AGENT
│   └── DWT-SVD embedding: 2-level Haar DWT → SVD on LL subband
│   └── Survives: rotation ±15°, JPEG compression 40%, phone photograph
│   └── centre_id + student_id recoverable from any photograph
│
└── AUDIT AGENT
    └── Z-score analysis per question across all 5,000 centres
    └── PostgreSQL append-only ledger (write-once, hash-chained)
    └── Forensic PDF report: centre, anomalous questions, confidence
```

### Exam Day State Machine

```
DISTRIBUTE ──→ LOCK ──→ BROADCAST_TOKEN ──→ UNLOCK ──→ WATERMARK ──→ GENERATE
    │              │            │                │           │             │
MinIO AES      Invigilator  Satellite         Edge        Embed         Paper
packages       creds hashed decrypt key      servers     watermarks    to spools
loaded                      via satellite    rebuild     into files
```

### Edge Resilience

Every exam centre receives an AES-encrypted question bundle **24 hours in advance**. The time-locked decrypt token is broadcast via **satellite link + SMS fallback** at T-45 minutes. Each of 5,000 centres generates its paper **independently** — central server failure affects zero centres.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Agent Orchestration** | LangGraph 0.2.28 |
| **LLM** | Claude API — claude-sonnet-4-20250514 |
| **RAG & Vector Search** | FAISS + text-embedding-3-small |
| **Watermarking** | PyWavelets + NumPy (DWT-SVD) |
| **Scout / OSINT** | Telethon (Telegram MTProto) |
| **Live Proctoring** | WebRTC + MediaPipe (gaze + landmark detection) |
| **Backend** | FastAPI + PostgreSQL + Redis pub/sub |
| **Edge Storage** | MinIO (AES-encrypted paper packages) |
| **Real-time** | WebSocket (live agent trace streaming) |
| **Frontend** | React 19 + TypeScript + Tailwind CSS |
| **Deployment** | Vercel (frontend) + Firebase (real-time sync) |
| **Auth** | Custom JWT (Jose) + bcrypt (cost 12) |
| **Audit** | PostgreSQL append-only ledger |

---

## Quick Start

### Frontend

```bash
git clone https://github.com/workamannakashe-sudo/omnishield-ai.git
cd omnishield-ai
npm install
npm run dev
```

Open [https://omnishield-ai.vercel.app/](https://omnishield-ai.vercel.app/)  
**Demo login:** `admin` / `admin123`

### Watermark Agent (Python)

```bash
pip install PyWavelets numpy Pillow
python watermark_agent.py
```

Expected output:
```
=== OmniShield AI DWT-SVD Watermark Demo ===
[WATERMARK EMBEDDED] Payload: CENTRE:MAH_AMR_001|STUDENT:S004|EXAM:NEET_2027
[WATERMARK EXTRACTED] Result: CENTRE:MAH_AMR_001|STUDENT:S004|EXAM:NEET_2027
Match: True
=== Demo Complete ===
```

---

## The 14 Operator Modules

| # | Module | What It Does |
|---|--------|-------------|
| 1 | **Command Center** | Live stats, edge server topology map, system log feed |
| 2 | **Exam Configuration** | 3-step wizard: exam type, date, shift, marking rules |
| 3 | **Question Bank & OCR** | PDF upload, OCR extraction, manual insertion, tagging |
| 4 | **Paper Builder** | Drag-and-drop canvas, SEAL PAPER cryptographic lock |
| 5 | **Candidate Control** | Bulk CSV import, centre allocation, admit cards |
| 6 | **Threat Intel** | Scout Agent feed, Risk Needle Index, Dual-Authority trigger |
| 7 | **Exam Day Control** | 6-phase state machine, emergency controls |
| 8 | **Center Portal** | 5,000-node download matrix, lock status per centre |
| 9 | **Live Proctoring** | WebRTC + MediaPipe, AI signals, broadcast controls |
| 10 | **Paper Previewer** | Secure read-only with focus-lost blur detection |
| 11 | **Forensics & Audit** | Roll tracer, append-only ledger, hash chain |
| 12 | **Analytics** | Question approval timeline, OSINT threat history |
| 13 | **AI Coordinator** | Claude assistant with live exam context |
| 14 | **Global Config** | OSINT params, similarity threshold, SMTP/Twilio APIs |

---

## Security Properties

- **Zero pre-existence window** — Paper generated at T-45 min. No admin can access content before satellite token broadcast.
- **Dual-Authority Protocol** — Backup paper requires simultaneous NTA Director + Chairman sign-off. No single point of compromise.
- **Append-only audit ledger** — PostgreSQL write-once table, hash-chained. Forensic evidence that cannot be altered post-fact.
- **Per-student watermark** — Every PDF cryptographically unique. Leaked photograph traceable to exact student and centre in seconds.
- **Hashed blueprint only** — Scout Agent never sees real questions. Structural fingerprints compared against hashed blueprint only.
- **Edge independence** — 5,000 centres operate without central connectivity after token broadcast.

---

## Documentation

| Document | Contents |
|----------|---------|
| [01 — PRD](01_PRD_OmniShield_AI.md) | Product requirements, user stories, success metrics |
| [02 — TRD](02_TRD_OmniShield_AI.md) | Technical architecture, API contracts, security model |
| [03 — App Flow](03_App_Flow_OmniShield_AI.md) | User journeys, state transitions, flow diagrams |
| [04 — UI/UX Brief](04_UI_UX_Design_Brief_OmniShield_AI.md) | Design system, component specs, typography |
| [05 — Backend Schema](05_Backend_Schema_OmniShield_AI.md) | 8-table PostgreSQL schema with indexes |
| [06 — Implementation Plan](06_Implementation_Plan_OmniShield_AI.md) | 6-day sprint breakdown, task allocation |

---

## Team

**3rd-year B.E. —Students**  

Built in **6 days** for FAR AWAY 2026 — India's Biggest International Hackathon.

---

<div align="center">

*OmniShield AI — Because 2.27 million students deserve better than a cancelled exam.*

</div>
