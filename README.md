<div align="center">

# 🛡️ OmniShield AI

### Autonomous Examination Integrity & Secure Paper Generation System

**FAR AWAY 2026 Hackathon** &nbsp;|&nbsp; Domain: **Examinations + Agentic & Autonomous Systems**

[[Live Demo](https://img.shields.io/badge/Live%20Demo-omnishield--ai.vercel.app-00d4ff?style=for-the-badge&logo=vercel)](https://omnishield-ai.vercel.app)

<img width="1584" height="754" alt="image" src="https://github.com/user-attachments/assets/fb685d8a-aaa1-43b3-bad6-9f8778581ecc" />


<img width="1582" height="769" alt="WhatsApp Image 2026-06-09 at 11 42 34 AM" src="https://github.com/user-attachments/assets/d9aed4ae-9df1-4fad-8f03-c29287401572" />


<img width="1596" height="744" alt="WhatsApp Image 2026-06-09 at 11 43 29 AM" src="https://github.com/user-attachments/assets/95825229-f70f-41a3-8c5e-046ce0338dcb" />


<img width="1584" height="754" alt="WhatsApp Image 2026-06-09 at 11 43 47 AM" src="https://github.com/user-attachments/assets/3457ff62-65b3-48e7-b653-5a1b14407a2f" />





</div>

---

## 📰 The Problem

**On June 4, 2026, NEET was cancelled for 2.27 million students.**

A paper leaked from a printing facility in Jaipur — before a single student had opened the booklet. The re-examination cost the government over ₹500 Crore. This was not an isolated incident. The CBI has handled 18 exam fraud cases since 2015 with near-zero conviction rate.

**The root cause is structural, not criminal:** Question papers exist for **72 hours** before exam day. Every hour they exist in physical form is an hour they can be photographed, forwarded, and sold.

> *You cannot stop a leak. But you can eliminate the window in which a leak is possible.*

---

## 💡 Our Solution

OmniShield AI is a **multi-agent autonomous system** that secures national examinations across three phases — before, during, and after — without any human touching the paper between creation and the student's hands.

| Phase | What Happens | Agents Involved |
|-------|-------------|-----------------|
| **Before Exam** | Public channels monitored for leaked content in real-time | Scout → Verify → Action |
| **Exam Day** | Paper generated just 45 minutes before start, watermarked per student | RAG Gen → Variation → Assembly → Watermark |
| **After Exam** | Answer patterns audited forensically to identify compromised centres | Audit Agent |

**The leak window: 72 hours → 45 minutes.**

---

## 🏗️ System Architecture

```
┌─────────────────────────── PHASE 1: PRE-EXAM ───────────────────────────┐
│                                                                          │
│   Scout Agent ──→ Verification Agent ──→ Action Agent                   │
│   (OSINT monitor)  (fingerprint match)   (evidence + backup trigger)    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                              │ leak confirmed: triggers backup
                              ▼
┌─────────────────────────── PHASE 2: EXAM DAY ───────────────────────────┐
│                                                                          │
│   RAG Generation ──→ Variation Agent ──→ Assembly Agent ──→ Watermark   │
│   (Claude API +       (surface vary       (180Q in         (DWT-SVD     │
│    FAISS vector DB)    per centre)         <45 seconds)     per student) │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────── PHASE 3: POST-EXAM ──────────────────────────┐
│                                                                          │
│   Audit Agent: Z-score analysis across centres → Forensic PDF report    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Admin Dashboard

The OmniShield Control Centre gives exam administrators full visibility across all three phases.

| Page | What It Does |
|------|-------------|
| **Dashboard** | Real-time stats: active alerts, question banks, upcoming exams, system status |
| **Leakage Alerts** | Live feed of Scout Agent detections with confidence scores, source channel, evidence package. Status workflow: New → Investigating → Resolved |
| **Question Banks** | Create and manage encrypted question pools. Trigger AI generation via Claude API |
| **Flagged Questions** | Human review queue for AI-generated questions. Approve or reject with reason |
| **Paper Generator** | 3-step flow: configure distribution → preview → download DWT-SVD watermarked PDF |

**Demo credentials:** `admin` / `admin123`

---

## 🔬 Key Technical Features

### DWT-SVD Cryptographic Watermarking
Every generated paper receives an invisible watermark encoding `centre_id` + `student_id` using a 2-level Haar Discrete Wavelet Transform with Singular Value Decomposition embedding. The watermark survives rotation (±15°), JPEG compression (40% quality), and phone photograph degradation.

```python
# From watermark_agent.py — run locally to verify
payload = "CENTRE:MAH_AMR_001|STUDENT:S004|EXAM:NEET_2027"
metadata = embed_watermark("paper.png", payload, "paper_watermarked.png")
result = extract_watermark("paper_watermarked.png", metadata["original_S"], metadata["payload_length"])
# Output → Match: True
```

### RAG-Powered Question Generation
Questions are generated via Claude API with Retrieval-Augmented Generation over the question bank (FAISS vector index). A dual-agent validation loop ensures factual accuracy, and a similarity filter rejects any question with >80% cosine similarity to known coaching material.

### LangGraph Multi-Agent Orchestration
All agents run as nodes in a LangGraph StateGraph with conditional routing. The full pipeline trace is streamable via WebSocket to the dashboard — judges see every agent decision in real-time.

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Agent Orchestration** | LangGraph | 0.2.28 |
| **LLM** | Claude API (claude-sonnet-4-20250514) | Latest |
| **RAG & Vector Search** | FAISS + text-embedding-3-small | — |
| **Watermarking** | PyWavelets + NumPy (DWT-SVD) | — |
| **Scout / OSINT** | Telethon | — |
| **Frontend** | React 19 + TypeScript + Tailwind CSS | 19.2.1 |
| **Routing** | Wouter | 3.3.5 |
| **API Layer** | tRPC | 11.6.0 |
| **Backend** | Express.js + Node.js | 4.21.2 |
| **Database ORM** | Drizzle ORM + MySQL | 0.44.5 |
| **Auth** | Custom JWT (Jose) | 6.1.0 |
| **Build** | Vite | 7.1.7 |
| **Security** | Bcrypt + AES (Fernet) | — |

---

## 🚀 Quick Start

### Run the Frontend (Live Demo)

```bash
# Clone the repo
git clone https://github.com/workamannakashe-sudo/omnishield-ai.git
cd omnishield-ai

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [https://omnishield-ai.vercel.app]


### Run the Watermark Agent (Python)

```bash
# Install dependencies
pip install PyWavelets numpy Pillow

# Run demo — should print Match: True
python watermark_agent.py
```

Expected output:
```
=== OmniShield AI DWT-SVD Watermark Demo ===
[WATERMARK EMBEDDED] Payload: CENTRE:MAH_AMR_001|STUDENT:S004|EXAM:NEET_2027
[WATERMARK EMBEDDED] Output: test_paper_watermarked.png
--- Extracting from watermarked image ---
[WATERMARK EXTRACTED] Result: CENTRE:MAH_AMR_001|STUDENT:S004|EXAM:NEET_2027
Match: True
=== Demo Complete ===
```

---

## 📁 Project Structure

```
omnishield-ai/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx        # Stats overview + quick actions
│   │   ├── Alerts.tsx           # Scout Agent feed + status workflow
│   │   ├── QuestionBanks.tsx    # RAG question bank management
│   │   ├── FlaggedQuestions.tsx # Human review queue
│   │   └── PaperGenerator.tsx   # 3-step watermarked PDF generator
│   ├── components/
│   │   └── DashboardLayout.tsx  # Sidebar + protected route wrapper
│   └── App.tsx                  # Router + auth guard
├── watermark_agent.py           # DWT-SVD watermark — runs standalone
├── 01_PRD_OmniShield_AI.md      # Product Requirements Document
├── 02_TRD_OmniShield_AI.md      # Technical Requirements Document
├── 03_App_Flow_OmniShield_AI.md # User journey & flow diagrams
├── 04_UI_UX_Design_Brief.md     # Design system & component specs
├── 05_Backend_Schema.md         # 8-table MySQL schema
├── 06_Implementation_Plan.md    # 6-day sprint breakdown
└── README.md
```

---

## 🔐 Security Design

- **Zero paper pre-existence:** Paper generated T-45 minutes before exam. Admin cannot access paper content before unlock.
- **Hashed blueprint comparison:** Scout Agent never sees real questions — only compares structural fingerprints against a hashed exam blueprint.
- **Per-student watermark:** Every PDF is cryptographically unique. Source of any leak traceable to individual student and centre.
- **Edge resilience:** Encrypted question bank pre-deployed to local centre server. Generates independently if central server goes offline.
- **JWT auth:** 24-hour expiry, bcrypt hashing (cost 12), HttpOnly secure cookies.

---

## 📊 Impact Numbers

| Metric | Value |
|--------|-------|
| Students affected by NEET 2026 | 2.27 million |
| Re-examination cost | ₹500+ Crore |
| Exam fraud CBI cases (2015–2025) | 18 cases, ~0 convictions |
| Leak window before OmniShield | 72 hours |
| Leak window with OmniShield | **45 minutes** |
| Paper generation time | **< 45 seconds** |
| Leak detection time | **< 30 seconds** |
| Watermark survival at 40% compression | **✅ Verified** |

---

## 👥 Team

**3rd-year B.Tech. students**

Built in **6 days** for FAR AWAY 2026 — India's Biggest International Hackathon.

---

<div align="center">
<i>OmniShield AI — Because 2.27 million students deserve better than a cancelled exam.</i>
</div>
