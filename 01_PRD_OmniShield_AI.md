# Product Requirements Document (PRD)
## OmniShield AI - Examination Integrity Platform


---

## 1. Executive Summary

OmniShield AI is a comprehensive, AI-powered examination integrity and paper generation platform designed for medical and academic institutions. The platform combines advanced leakage detection, intelligent question generation, dual-agent validation, and secure paper watermarking to safeguard exam integrity while streamlining paper creation workflows.

The system is built around an intuitive admin dashboard that provides real-time monitoring of security threats, management of question banks, review of AI-flagged content, and generation of tamper-proof examination papers with embedded digital watermarks.

---

## 2. Problem Statement

Medical and academic institutions face critical challenges in maintaining examination integrity:

- **Information Leakage:** Exam questions and answers leak through social media, messaging platforms, and dark web channels, compromising exam validity
- **Question Management Overhead:** Creating high-quality, unique exam questions requires significant manual effort and expertise
- **Quality Assurance Gaps:** AI-generated content requires human validation to catch factual errors, biases, and hallucinations
- **Paper Security:** Printed exam papers lack tamper-evident mechanisms, making it difficult to detect unauthorized distribution
- **Incident Response:** No centralized system exists to track, investigate, and resolve security incidents

---

## 3. Target Users

**Primary User:** Examination Board Administrators
- Manage question banks organized by subject and difficulty
- Monitor leakage alerts in real-time
- Review and approve AI-generated questions
- Generate and distribute secure exam papers

**Secondary Users:** Academic Institutions, Medical Colleges, Testing Centers
- Deploy the platform for their entrance exams and board examinations
- Integrate with existing examination workflows
- Maintain audit trails for compliance

---

## 4. Core Features

### 4.1 Admin Dashboard
A centralized command center displaying:
- **Live Statistics:** Active alert count, question bank count, upcoming exam count
- **Quick Actions:** One-click access to all major workflows
- **System Status:** Real-time operational health of all modules
- **Responsive Design:** Works seamlessly on desktop and tablet devices

### 4.2 Leakage Alerts Module
Detects and tracks information leaks across multiple channels:
- **Detection Sources:** Telegram, WhatsApp, dark web forums, social media
- **Alert Table:** Sortable and filterable view showing source channel, timestamp, detected content, confidence score, and status
- **Detail View:** Expanded view of each alert with full context and metadata
- **Status Workflow:** Enforced workflow (New → Investigating → Resolved) ensures systematic incident handling
- **Confidence Scoring:** AI-powered scoring (0-100%) indicates likelihood of genuine leak

### 4.3 Question Bank Management
Organize and manage examination questions:
- **Create Banks:** Define banks by subject (Biology, Chemistry, Anatomy, etc.)
- **AI Generation:** Trigger LLM-powered question generation with configurable difficulty levels
- **Question Display:** View all questions with difficulty tags (Easy/Medium/Hard)
- **Edit & Delete:** Manage question content and remove outdated questions
- **Search & Filter:** Find questions by subject, difficulty, or keyword

### 4.4 Flagged Questions Review Queue
Human validation layer for AI-generated content:
- **Automatic Flagging:** Questions flagged by dual-agent validation system appear in queue
- **Flag Reasons:** Display specific reason for each flag (similarity match, factual inconsistency, hallucination detection)
- **Approve/Reject:** Admins can approve questions for use or reject and regenerate
- **Status Tracking:** Track approval status of each flagged question
- **Batch Operations:** Approve or reject multiple questions at once

### 4.5 Examination Paper Generator
Create secure, watermarked exam papers:
- **Bank Selection:** Choose source question bank
- **Configuration:** Set exam title, total question count, duration
- **Difficulty Distribution:** Explicitly configure percentage of Easy/Medium/Hard questions
- **Preview:** Visual preview of assembled paper before finalization
- **Watermarking:** Apply DWT-SVD digital watermark at download time
- **PDF Export:** Generate and download final paper as PDF with embedded watermark

### 4.6 Authentication & Authorization
Secure access control:
- **Admin Login:** Username/password authentication with JWT sessions
- **Protected Routes:** All dashboard routes require valid session
- **Session Management:** Automatic session expiration and refresh
- **Logout:** Secure session termination

### 4.7 Backend Database Schema
Comprehensive data model supporting all features:
- **admins:** Admin user accounts with credentials
- **alerts:** Leakage detection records with confidence scores
- **alert_details:** Extended context for each alert
- **question_banks:** Subject-organized question collections
- **questions:** Individual exam questions with metadata
- **flagged_questions:** Questions pending human review
- **examinations:** Generated exam papers with metadata
- **watermarks:** Watermark metadata and application records

### 4.8 AI Question Generation
Intelligent question creation with validation:
- **LLM Integration:** Uses state-of-the-art language models for question generation
- **Similarity Filter:** Automatically filters questions matching known coaching materials
- **Dual-Agent Validation:** Two independent agents validate factual accuracy
- **Uncertain Output Flagging:** Automatically flags low-confidence outputs for human review
- **Batch Generation:** Generate multiple questions in single operation

---

## 5. User Workflows

### Workflow 1: Monitor Leakage Alerts
1. Admin logs into dashboard
2. Views "Active Alerts" stat card
3. Clicks "View Alerts" to see full alert table
4. Filters alerts by status (New/Investigating/Resolved)
5. Clicks alert row to view details
6. Updates status from "New" → "Investigating" → "Resolved"

### Workflow 2: Generate and Validate Questions
1. Admin navigates to Question Banks
2. Creates new bank (name: "NEET Biology 2026", subject: "Biology")
3. Clicks "Generate" to trigger AI question generation
4. Specifies: 50 questions, Medium difficulty
5. System generates questions and flags uncertain ones
6. Admin navigates to Flagged Questions
7. Reviews each flagged question with reason displayed
8. Approves valid questions or rejects for regeneration

### Workflow 3: Create Exam Paper
1. Admin goes to Paper Generator
2. Selects question bank: "NEET Biology 2026"
3. Sets exam title: "NEET Entrance Exam - June 2026"
4. Configures: 180 questions total
5. Sets difficulty distribution: 30% Easy, 50% Medium, 20% Hard
6. Previews assembled paper
7. Clicks "Download with Watermark"
8. System applies DWT-SVD watermark and generates PDF
9. PDF automatically downloads with embedded watermark

---

## 6. Technical Architecture

### Frontend
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS 4 with custom editorial design tokens
- **State Management:** React hooks with tRPC client
- **Routing:** Wouter for lightweight client-side routing
- **UI Components:** shadcn/ui for consistent, accessible components

### Backend
- **Framework:** Express.js 4 with Node.js
- **API Layer:** tRPC 11 for end-to-end type safety
- **Database:** MySQL with Drizzle ORM
- **Authentication:** JWT sessions with Custom JWT Authentication integration
- **LLM Integration:** Claude API (Anthropic) for question generation
- **Watermarking:** DWT-SVD algorithm for paper security

### Database
- **Engine:** MySQL 8.0+
- **ORM:** Drizzle ORM for type-safe queries
- **Schema:** 8 tables with proper foreign key relationships
- **Migrations:** Version-controlled SQL migrations

---

## 7. Non-Functional Requirements

### Security
- All passwords hashed with bcrypt
- JWT tokens with 24-hour expiration
- HTTPS-only communication
- SQL injection prevention via parameterized queries
- XSS protection via React's built-in escaping

### Performance
- Dashboard loads in <2 seconds
- Alert table renders 1000+ rows with virtualization
- Question generation completes in <30 seconds
- PDF generation and download in <5 seconds

### Scalability
- Support 1000+ concurrent admin users
- Handle 10,000+ alerts per day
- Generate 1000+ exam papers per month
- Store 100,000+ questions across all banks

### Reliability
- 99.5% uptime SLA
- Automated daily backups
- Graceful error handling with user-friendly messages
- Comprehensive audit logging

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

---

## 8. Success Metrics

- **Adoption:** 50+ institutions using platform within first year
- **Incident Resolution:** Average alert resolution time <24 hours
- **Question Quality:** 95%+ approval rate for AI-generated questions
- **User Satisfaction:** Net Promoter Score >50
- **System Reliability:** 99.5% uptime
- **Performance:** 95th percentile page load time <2 seconds

---

## 9. Timeline & Milestones

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| MVP | 4 weeks | Core dashboard, alerts, question banks, paper generator |
| Beta | 2 weeks | Flagged questions review, watermarking, auth |
| Launch | 1 week | Documentation, training, deployment |
| Post-Launch | Ongoing | Monitoring, optimization, feature enhancements |

---

## 10. Success Criteria

The platform will be considered successful when:
1. All 8 core features are fully functional and tested
2. Admin users can complete all workflows without assistance
3. System handles peak load (1000 concurrent users) without degradation
4. 95%+ of AI-generated questions pass human review
5. All leakage alerts are resolved within 24 hours
6. Zero security incidents or data breaches
7. User satisfaction score >4.5/5.0

---
