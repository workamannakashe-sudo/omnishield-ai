# Technical Requirements Document (TRD)
## OmniShield AI - Examination Integrity Platform

**Version:** 1.0  
**Date:** June 2026  
**Status:** Submission Ready

---

## 1. Technology Stack

### Frontend Stack
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React | 19.2.1 | UI component library |
| Language | TypeScript | 5.9.3 | Type-safe development |
| Styling | Tailwind CSS | 4.1.14 | Utility-first CSS framework |
| UI Components | shadcn/ui | Latest | Pre-built accessible components |
| Routing | Wouter | 3.3.5 | Lightweight client-side routing |
| State Management | React Hooks | Native | Built-in state management |
| API Client | tRPC React Query | 11.6.0 | Type-safe RPC client |
| Build Tool | Vite | 7.1.7 | Fast build and dev server |
| Icons | Lucide React | 0.453.0 | Icon library |
| Forms | React Hook Form | 7.64.0 | Efficient form handling |
| Validation | Zod | 4.1.12 | Schema validation |

### Backend Stack
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Express.js | 4.21.2 | HTTP server framework |
| Language | TypeScript | 5.9.3 | Type-safe backend |
| Runtime | Node.js | 22.13.0 | JavaScript runtime |
| RPC Framework | tRPC | 11.6.0 | Type-safe API layer |
| Database ORM | Drizzle ORM | 0.44.5 | Type-safe database queries |
| Database Driver | MySQL2 | 3.15.0 | MySQL connection driver |
| Authentication | Jose | 6.1.0 | JWT token handling |
| LLM Integration | Claude API (Anthropic) | Latest | Question generation |
| Validation | Zod | 4.1.12 | Schema validation |
| Testing | Vitest | 2.1.4 | Unit testing framework |
| Agent Orchestration | LangGraph | 0.2.28 | Multi-agent state machine |

### Infrastructure & DevOps
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Database | MySQL 8.0+ | Relational data storage |
| Cloud Platform | Google Cloud Run | Deployment and hosting |
| Authentication | Custom JWT Authentication | User authentication |
| Storage | S3-compatible | File and document storage |
| CI/CD | GitHub Actions | Automated testing and deployment |
| Monitoring | Google Analytics | Usage and performance tracking |

---

## 2. System Architecture

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Dashboard  │  │   Alerts     │  │ Paper Gen    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Question     │  │ Flagged      │  │ Login        │       │
│  │ Banks        │  │ Questions    │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                          │
                    tRPC Client
                          │
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (tRPC)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routers: auth, dashboard, alerts, questions, etc.  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Auth Service │  │ Alert        │  │ Question     │       │
│  │              │  │ Service      │  │ Service      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Paper Gen    │  │ LLM Service  │  │ Watermark    │       │
│  │ Service      │  │              │  │ Service      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│                  Data Access Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Drizzle ORM Query Builders                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MySQL 8.0+ with 8 core tables                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### Table: admins
```sql
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  lastLogin TIMESTAMP
);
```

### Table: alerts
```sql
CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adminId INT,
  timestamp TIMESTAMP DEFAULT NOW(),
  sourceChannel VARCHAR(50) NOT NULL,
  detectedContent TEXT NOT NULL,
  confidenceScore DECIMAL(5,2) NOT NULL,
  status ENUM('New','Investigating','Resolved') DEFAULT 'New',
  FOREIGN KEY (adminId) REFERENCES admins(id)
);
```

### Table: alertDetails
```sql
CREATE TABLE alertDetails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alertId INT NOT NULL,
  fullContent TEXT,
  context TEXT,
  mediaUrl VARCHAR(255),
  FOREIGN KEY (alertId) REFERENCES alerts(id)
);
```

### Table: questionBanks
```sql
CREATE TABLE questionBanks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adminId INT,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  lastModified TIMESTAMP DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (adminId) REFERENCES admins(id)
);
```

### Table: questions
```sql
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  questionBankId INT NOT NULL,
  questionText TEXT NOT NULL,
  options JSON NOT NULL,
  correctAnswer VARCHAR(255) NOT NULL,
  difficulty ENUM('Easy','Medium','Hard') NOT NULL,
  source ENUM('Synthetic','Human-authored') NOT NULL,
  watermarkId INT,
  FOREIGN KEY (questionBankId) REFERENCES questionBanks(id)
);
```

### Table: flaggedQuestions
```sql
CREATE TABLE flaggedQuestions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  questionId INT UNIQUE NOT NULL,
  flaggedAt TIMESTAMP DEFAULT NOW(),
  reason TEXT NOT NULL,
  status ENUM('Pending Review','Approved','Rejected') DEFAULT 'Pending Review',
  reviewedByAdminId INT,
  FOREIGN KEY (questionId) REFERENCES questions(id),
  FOREIGN KEY (reviewedByAdminId) REFERENCES admins(id)
);
```

### Table: examinations
```sql
CREATE TABLE examinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  questionBankId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  examDate TIMESTAMP NOT NULL,
  durationMinutes INT NOT NULL,
  status ENUM('Draft','Scheduled','Active','Completed') NOT NULL,
  generatedAt TIMESTAMP DEFAULT NOW(),
  watermarkedPaperUrl VARCHAR(255),
  FOREIGN KEY (questionBankId) REFERENCES questionBanks(id)
);
```

### Table: watermarks
```sql
CREATE TABLE watermarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scheme VARCHAR(50) NOT NULL,
  metadata JSON,
  appliedAt TIMESTAMP DEFAULT NOW()
);
```

---

## 4. API Endpoints (tRPC Procedures)

### Authentication Routes
| Procedure | Input | Output | Purpose |
|-----------|-------|--------|---------|
| `auth.me` | - | `User \| null` | Get current user |
| `auth.logout` | - | `{ success: boolean }` | Logout user |

### Dashboard Routes
| Procedure | Input | Output | Purpose |
|-----------|-------|--------|---------|
| `dashboard.getStats` | - | `{ activeAlerts, questionBanks, upcomingExams }` | Get dashboard stats |

### Alerts Routes
| Procedure | Input | Output | Purpose |
|-----------|-------|--------|---------|
| `alerts.list` | `{ limit, offset, status? }` | `Alert[]` | List alerts with pagination |
| `alerts.getById` | `{ id }` | `Alert` | Get alert details |
| `alerts.updateStatus` | `{ id, status }` | `{ success }` | Update alert status |

### Question Banks Routes
| Procedure | Input | Output | Purpose |
|-----------|-------|--------|---------|
| `questionBanks.list` | `{ limit, offset }` | `QuestionBank[]` | List question banks |
| `questionBanks.getById` | `{ id }` | `QuestionBank` | Get bank details |
| `questionBanks.create` | `{ name, subject }` | `{ id, name, subject }` | Create new bank |
| `questionBanks.getQuestions` | `{ bankId }` | `Question[]` | Get questions in bank |

### Questions Routes
| Procedure | Input | Output | Purpose |
|-----------|-------|--------|---------|
| `questions.generate` | `{ bankId, subject, difficulty, count }` | `{ success, count }` | Generate questions via LLM |

### Flagged Questions Routes
| Procedure | Input | Output | Purpose |
|-----------|-------|--------|---------|
| `flaggedQuestions.list` | `{ status? }` | `FlaggedQuestion[]` | List flagged questions |
| `flaggedQuestions.updateStatus` | `{ id, status }` | `{ success }` | Approve/reject question |

### Examinations Routes
| Procedure | Input | Output | Purpose |
|-----------|-------|--------|---------|
| `examinations.generate` | `{ bankId, title, questionCount, easyPercentage, mediumPercentage, hardPercentage }` | `{ examId, questionCount, questions }` | Generate exam paper |
| `examinations.getById` | `{ id }` | `Examination` | Get exam details |

---

## 5. Key Algorithms & Implementations

### 5.1 Alert Status Workflow Enforcement
```typescript
// Enforce: New → Investigating → Resolved (no skipping)
const statusOrder = ["New", "Investigating", "Resolved"];
const currentIndex = statusOrder.indexOf(alert.status);
const newIndex = statusOrder.indexOf(input.status);

if (newIndex <= currentIndex) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Status must follow: New → Investigating → Resolved"
  });
}
```

### 5.2 Question Difficulty Distribution
```typescript
const easyCount = Math.round(totalQuestions * easyPercentage / 100);
const mediumCount = Math.round(totalQuestions * mediumPercentage / 100);
const hardCount = totalQuestions - easyCount - mediumCount;

// Select questions matching distribution
const selectedQuestions = [
  ...easyQuestions.slice(0, easyCount),
  ...mediumQuestions.slice(0, mediumCount),
  ...hardQuestions.slice(0, hardCount)
];
```

### 5.3 DWT-SVD Watermarking
```typescript
// Applied at PDF generation time
// Discrete Wavelet Transform (DWT) decomposes image into frequency bands
// Singular Value Decomposition (SVD) embeds watermark in singular values
// Result: Invisible, robust watermark resistant to common attacks
```

### 5.4 LLM Question Generation
```typescript
const response = await invokeLLM({
  messages: [
    { role: "system", content: "Generate medical exam questions" },
    { role: "user", content: `Generate ${count} ${difficulty} questions for ${subject}` }
  ],
  response_format: {
    type: "json_schema",
    json_schema: { /* schema */ }
  }
});
```

---

## 6. Security Requirements

### Authentication & Authorization
- JWT tokens with 24-hour expiration
- Bcrypt password hashing (cost factor: 12)
- Session validation on every request
- HTTPS-only communication
- Secure cookie flags (HttpOnly, Secure, SameSite)

### Data Protection
- SQL injection prevention via parameterized queries
- XSS protection via React escaping
- CSRF protection via token validation
- Input validation on all endpoints
- Rate limiting on sensitive operations

### Audit & Compliance
- Comprehensive audit logging of all admin actions
- Alert incident tracking and resolution history
- Question generation and approval audit trail
- Paper generation and distribution logs
- GDPR compliance for user data

---

## 7. Performance Requirements

| Metric | Target | Implementation |
|--------|--------|-----------------|
| Dashboard Load | <2s | Lazy loading, pagination |
| Alert Table (1000 rows) | <3s | Virtual scrolling |
| Question Generation | <30s | Async LLM calls |
| PDF Generation | <5s | Server-side generation |
| API Response | <200ms | Query optimization, caching |
| Database Query | <100ms | Indexed queries, connection pooling |

---

## 8. Deployment Architecture

### Development Environment
- Local Node.js dev server with hot reload
- Local MySQL database
- Environment variables via .env file

### Production Environment
- Cloud Run (Google Cloud) or equivalent
- Managed MySQL database (Cloud SQL)
- CDN for static assets
- Automated SSL certificates
- Load balancing for high availability

### CI/CD Pipeline
- GitHub Actions for automated testing
- TypeScript compilation check
- Vitest unit tests
- Deployment to staging on PR
- Production deployment on merge to main

---

## 9. Monitoring & Logging

### Application Metrics
- Request latency (p50, p95, p99)
- Error rates and types
- Database query performance
- LLM API usage and costs
- User session duration

### Logging Strategy
- Structured JSON logging
- Log levels: DEBUG, INFO, WARN, ERROR
- Centralized log aggregation
- Audit trail for security events
- Performance profiling logs

---

## 10. Third-Party Integrations

### Claude API (Anthropic)
- **Purpose:** Question generation via Claude claude-sonnet-4-20250514
- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Authentication:** API key in environment variables
- **Rate Limits:** 100 requests/minute, 1M tokens/minute

### Custom JWT Authentication
- **Purpose:** Admin user authentication
- **Endpoint:** `https://api./oauth`
- **Callback URL:** `https://omnishield-ai.web.app/api/oauth/callback`

### S3-Compatible Storage
- **Purpose:** Store generated PDFs and media
- **Endpoint:** Configured via environment variables
- **Authentication:** AWS credentials

---

## 11. Testing Strategy

### Unit Tests (Vitest)
- Authentication procedures
- Alert status workflow validation
- Question generation logic
- Difficulty distribution calculation
- Watermark application

### Integration Tests
- End-to-end alert workflow
- Question bank CRUD operations
- Paper generation pipeline
- Database transactions

### Performance Tests
- Load testing with 1000 concurrent users
- Database query optimization
- API response time benchmarks
- PDF generation performance

---

**Document Owner:** Technical Architecture  
**Last Updated:** June 2026  
**Next Review:** July 2026
