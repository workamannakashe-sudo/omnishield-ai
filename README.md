# OmniShield AI
### Autonomous Examination Integrity and Secure Paper Generation System
FAR AWAY 2026 Hackathon | Examinations + Agentic and Autonomous Systems

---

## The Problem
NEET 2026 was cancelled for 2.27 million students due to a paper leak from a printing facility. Root cause: question papers exist for 72 hours before exam day. 72 hours of human touchpoints. 72 hours of vulnerability.

## Our Solution
OmniShield AI is a multi-agent autonomous system that eliminates the leak window entirely.

- Detects leaked content on public channels before the exam (Scout Agent)
- Generates exam papers just 45 minutes before start, eliminating the leak window (ExamForge)
- Watermarks every paper invisibly with DWT-SVD encoding tied to centre and student ID
- Audits answer patterns post-exam to forensically identify compromised centres

## Architecture

```
Scout Agent → Verification Agent → Action Agent
                    ↓ (leak confirmed: triggers backup)
RAG Generation → Variation → Assembly → Watermark Agent
                    ↓
              Post-Exam Audit Agent
```
