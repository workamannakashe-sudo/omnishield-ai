# Implementation Plan
## OmniShield AI - Examination Integrity Platform

---

## 1. Project Overview

**Project Name:** OmniShield AI  
**Duration:** 6-day hackathon sprint (MVP to launch)  
**Team Size:** 2 students (B.E. AI and DS, Sipna College of Engineering)  
**Technology Stack:** React 19, Express.js, MySQL, tRPC  
**Deployment:** Vercel for frontend, local FastAPI server for backend demo

---

## 2. Implementation Phases

### Phase 1: Foundation & Setup (Week 1)
**Duration:** 5 days  
**Objective:** Establish project infrastructure and core architecture

#### Tasks

| Task | Owner | Duration | Dependencies |
|------|-------|----------|--------------|
| Project initialization & Git setup | DevOps | 0.5 days | None |
| Database schema design & migration | Backend | 1 day | None |
| API layer setup (tRPC) | Backend | 1 day | DB schema |
| Authentication system (JWT) | Backend | 1.5 days | API layer |
| Frontend project setup & routing | Frontend | 1 day | None |
| Design system & CSS tokens | Design | 1 day | None |

#### Deliverables
- GitHub repository with CI/CD pipeline
- MySQL database with 8 tables
- tRPC router structure
- JWT authentication middleware
- React routing structure
- Design tokens in Tailwind CSS

#### Success Criteria
- All tables created and indexed
- Authentication endpoints working
- Frontend builds without errors
- Design tokens applied globally

---

### Phase 2: Core Features - Backend (Week 2)
**Duration:** 5 days  
**Objective:** Implement all backend business logic

#### Tasks

| Task | Owner | Duration | Dependencies |
|------|-------|----------|--------------|
| Dashboard stats procedures | Backend | 1 day | DB schema |
| Alerts CRUD & status workflow | Backend | 1.5 days | DB schema |
| Question bank procedures | Backend | 1 day | DB schema |
| Question generation (LLM) | Backend | 1.5 days | Question bank |
| Flagged questions procedures | Backend | 1 day | Question generation |
| Paper generation logic | Backend | 1 day | Question bank |
| Database query helpers | Backend | 0.5 days | All procedures |

#### Deliverables
- All tRPC procedures implemented
- LLM integration working
- Database queries optimized
- Error handling complete

#### Success Criteria
- All procedures tested with mock data
- LLM integration returns valid questions
- No N+1 queries
- Response times < 200ms

---

### Phase 3: Core Features - Frontend (Week 3)
**Duration:** 5 days  
**Objective:** Build all user-facing pages and components

#### Tasks

| Task | Owner | Duration | Dependencies |
|------|-------|----------|--------------|
| Login page UI | Frontend | 1 day | Design system |
| Dashboard page & layout | Frontend | 1 day | Design system |
| Alerts page & table | Frontend | 1.5 days | Alerts API |
| Question banks page | Frontend | 1 day | Question bank API |
| Flagged questions page | Frontend | 0.5 days | Flagged API |
| Paper generator page | Frontend | 1 day | Paper generation API |
| Responsive design & mobile | Frontend | 0.5 days | All pages |

#### Deliverables
- All pages implemented
- Responsive design working
- API integration complete
- Loading states & error handling

#### Success Criteria
- All pages render correctly
- API calls working
- Mobile responsive
- No console errors

---

### Phase 4: Advanced Features (Week 4)
**Duration:** 5 days  
**Objective:** Implement complex features and integrations

#### Tasks

| Task | Owner | Duration | Dependencies |
|------|-------|----------|--------------|
| Similarity filter for questions | Backend | 1.5 days | Question generation |
| Dual-agent validation system | Backend | 1.5 days | LLM integration |
| DWT-SVD watermarking | Backend | 1.5 days | Paper generation |
| PDF generation & download | Backend | 1 day | Paper generation |
| Real-time alert updates | Backend | 0.5 days | Alerts API |
| Advanced filtering & sorting | Frontend | 1 day | All pages |
| Batch operations (approve/reject) | Frontend | 0.5 days | Flagged questions |

#### Deliverables
- Similarity filtering working
- Dual-agent validation complete
- Watermarking implemented
- PDF generation working
- Advanced UI features

#### Success Criteria
- Similarity score accurate
- Watermark invisible but robust
- PDF downloads correctly
- Batch operations working
- Performance acceptable

---

### Phase 5: Testing & QA (Week 5)
**Duration:** 5 days  
**Objective:** Comprehensive testing and quality assurance

#### Tasks

| Task | Owner | Duration | Dependencies |
|------|-------|----------|--------------|
| Unit tests (backend) | QA | 1.5 days | All features |
| Integration tests | QA | 1.5 days | All features |
| UI/UX testing | QA | 1 day | All pages |
| Performance testing | QA | 0.5 days | All features |
| Security testing | Security | 1 day | All features |
| Bug fixes & refinement | Dev | 1 day | Test results |

#### Deliverables
- Test coverage > 80%
- All critical bugs fixed
- Performance benchmarks met
- Security audit passed

#### Success Criteria
- No critical bugs
- 95th percentile load time < 2s
- All security checks passed
- User acceptance testing approved

---

### Phase 6: Deployment & Launch (Week 6)
**Duration:** 5 days  
**Objective:** Deploy to production and launch

#### Tasks

| Task | Owner | Duration | Dependencies |
|------|-------|----------|--------------|
| Production environment setup | DevOps | 1 day | All features |
| Database migration to production | DevOps | 0.5 days | DB schema |
| SSL certificate setup | DevOps | 0.5 days | Environment |
| Monitoring & logging setup | DevOps | 1 day | Environment |
| Documentation & user guide | Tech Writer | 1 day | All features |
| Training & handoff | PM | 1 day | Documentation |
| Launch & go-live | DevOps | 0.5 days | All setup |

#### Deliverables
- Production environment running
- Monitoring dashboard active
- User documentation complete
- Training materials ready

#### Success Criteria
- Zero downtime deployment
- Monitoring alerts working
- Documentation complete
- Team trained

---

## 3. Detailed Task Breakdown

### 3.1 Database Schema Implementation

**File:** `drizzle/schema.ts`

```typescript
// Step 1: Define admins table
export const admins = mysqlTable('admins', {
  id: int('id').autoincrement().primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  passwordHash: varchar('passwordHash', { length: 255 }).notNull(),
  email: varchar('email', { length: 100 }).unique().notNull(),
  role: mysqlEnum('role', ['admin', 'superadmin']).default('admin'),
  createdAt: timestamp('createdAt').defaultNow(),
  lastLogin: timestamp('lastLogin'),
  isActive: boolean('isActive').default(true),
});

// Step 2: Define alerts table
export const alerts = mysqlTable('alerts', {
  id: int('id').autoincrement().primaryKey(),
  adminId: int('adminId').references(() => admins.id),
  timestamp: timestamp('timestamp').defaultNow(),
  sourceChannel: varchar('sourceChannel', { length: 50 }).notNull(),
  detectedContent: text('detectedContent').notNull(),
  confidenceScore: decimal('confidenceScore', { precision: 5, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['New', 'Investigating', 'Resolved']).default('New'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
});

// Step 3-8: Define remaining tables (alertDetails, questionBanks, questions, flaggedQuestions, examinations, watermarks)
```

**Migration Steps:**
1. Run `pnpm drizzle-kit generate` to create migration SQL
2. Review generated SQL file
3. Execute migration via `webdev_execute_sql`
4. Verify all tables created with `SHOW TABLES`
5. Verify indexes with `SHOW INDEX FROM table_name`

---

### 3.2 Authentication System

**File:** `server/routers.ts`

```typescript
// Step 1: Create login procedure
export const authRouter = router({
  login: publicProcedure
    .input(z.object({
      username: z.string().min(3),
      password: z.string().min(8),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify credentials
      // Generate JWT token
      // Set session cookie
      // Return user data
    }),

  // Step 2: Create logout procedure
  logout: protectedProcedure
    .mutation(({ ctx }) => {
      // Clear session cookie
      // Return success
    }),

  // Step 3: Create me procedure
  me: publicProcedure
    .query(({ ctx }) => {
      // Return current user or null
    }),
});
```

**Implementation Details:**
- Use bcrypt for password hashing (cost 12)
- Generate JWT with 24-hour expiration
- Store JWT in HttpOnly cookie
- Validate JWT on every request

---

### 3.3 Dashboard Implementation

**File:** `client/src/pages/Dashboard.tsx`

```typescript
// Step 1: Create dashboard layout
export default function Dashboard() {
  const { user } = useAuth();
  
  // Step 2: Fetch stats
  const { data: stats } = trpc.dashboard.getStats.useQuery();
  
  // Step 3: Render stat cards
  return (
    <DashboardLayout>
      <h1>Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Alerts" value={stats?.activeAlerts} />
        <StatCard label="Question Banks" value={stats?.questionBanks} />
        <StatCard label="Upcoming Exams" value={stats?.upcomingExams} />
      </div>
      {/* Quick actions */}
    </DashboardLayout>
  );
}
```

**Implementation Details:**
- Use DashboardLayout component
- Fetch stats on component mount
- Display loading skeleton while fetching
- Show error state if fetch fails
- Cache stats for 30 seconds

---

### 3.4 Alerts Feature

**Backend - File:** `server/routers.ts`

```typescript
export const alertsRouter = router({
  // Step 1: List alerts with pagination
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      status: z.enum(['New', 'Investigating', 'Resolved']).optional(),
    }))
    .query(async ({ input }) => {
      // Query alerts with filters
      // Return paginated results
    }),

  // Step 2: Get alert details
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // Get alert with details
    }),

  // Step 3: Update status (enforce workflow)
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['New', 'Investigating', 'Resolved']),
    }))
    .mutation(async ({ input }) => {
      // Validate status workflow
      // Update alert status
      // Return success
    }),
});
```

**Frontend - File:** `client/src/pages/Alerts.tsx`

```typescript
// Step 1: Fetch alerts list
const { data: alerts } = trpc.alerts.list.useQuery({ limit: 50 });

// Step 2: Render table with sorting/filtering
// Step 3: Handle row click to show details
// Step 4: Implement status update mutation
```

**Status Workflow Validation:**
```typescript
const statusOrder = ['New', 'Investigating', 'Resolved'];
const currentIndex = statusOrder.indexOf(alert.status);
const newIndex = statusOrder.indexOf(input.status);

if (newIndex <= currentIndex) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Status must follow: New → Investigating → Resolved',
  });
}
```

---

### 3.5 Question Generation

**File:** `server/routers.ts`

```typescript
export const questionsRouter = router({
  generate: protectedProcedure
    .input(z.object({
      bankId: z.number(),
      subject: z.string(),
      difficulty: z.enum(['Easy', 'Medium', 'Hard']),
      count: z.number().min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      // Step 1: Call LLM to generate questions
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Generate exam questions in JSON format',
          },
          {
            role: 'user',
            content: `Generate ${input.count} ${input.difficulty} questions for ${input.subject}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { /* schema */ },
        },
      });

      // Step 2: Parse and validate questions
      const questions = JSON.parse(response.choices[0].message.content);

      // Step 3: Apply similarity filter
      const filtered = await applySimilarityFilter(questions);

      // Step 4: Flag uncertain outputs
      const flagged = filtered.map(q => ({
        ...q,
        shouldFlag: q.confidence < 0.8,
      }));

      // Step 5: Save questions to database
      // Step 6: Create flagged entries for uncertain questions
      // Step 7: Return results
    }),
});
```

**Similarity Filter Implementation:**
```typescript
async function applySimilarityFilter(questions: Question[]): Promise<Question[]> {
  // For each question, calculate similarity to known coaching material
  // Discard questions with > 85% similarity
  // Return filtered questions
}
```

---

### 3.6 Paper Generator

**File:** `server/routers.ts`

```typescript
export const examinationsRouter = router({
  generate: protectedProcedure
    .input(z.object({
      bankId: z.number(),
      title: z.string(),
      questionCount: z.number(),
      easyPercentage: z.number(),
      mediumPercentage: z.number(),
      hardPercentage: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Step 1: Validate distribution
      const total = input.easyPercentage + input.mediumPercentage + input.hardPercentage;
      if (Math.abs(total - 100) > 0.1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Percentages must sum to 100%',
        });
      }

      // Step 2: Calculate question counts
      const easyCount = Math.round(input.questionCount * input.easyPercentage / 100);
      const mediumCount = Math.round(input.questionCount * input.mediumPercentage / 100);
      const hardCount = input.questionCount - easyCount - mediumCount;

      // Step 3: Select questions from bank
      const questions = await selectQuestionsByDifficulty(
        input.bankId,
        easyCount,
        mediumCount,
        hardCount
      );

      // Step 4: Create examination record
      const exam = await db.insert(examinations).values({
        questionBankId: input.bankId,
        title: input.title,
        totalQuestions: input.questionCount,
        easyCount,
        mediumCount,
        hardCount,
        createdByAdminId: ctx.user.id,
      });

      // Step 5: Return exam with questions
      return { examId: exam.id, questions };
    }),

  // Step 6: Download with watermark
  download: protectedProcedure
    .input(z.object({ examId: z.number() }))
    .query(async ({ input }) => {
      // Get exam and questions
      // Generate PDF
      // Apply DWT-SVD watermark
      // Return download URL
    }),
});
```

**Watermarking Implementation:**
```typescript
async function applyWatermark(pdfBuffer: Buffer): Promise<Buffer> {
  // Step 1: Extract PDF pages as images
  // Step 2: Apply DWT (Discrete Wavelet Transform)
  // Step 3: Apply SVD (Singular Value Decomposition)
  // Step 4: Embed watermark in singular values
  // Step 5: Reconstruct images
  // Step 6: Generate new PDF with watermarked pages
  // Step 7: Return watermarked PDF
}
```

---

## 4. Development Environment Setup

### Prerequisites
- Node.js 22.13.0
- MySQL 8.0+
- Git
- Docker (optional)

### Initial Setup
```bash
# Clone repository
git clone https://github.com/omnishield-ai/platform.git
cd omnishield_ai

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with database credentials

# Create database
mysql -u root -p < database/init.sql

# Run migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Start development server
pnpm dev
```

### Development Workflow
1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit: `git commit -m "feat: description"`
3. Push to GitHub: `git push origin feature/feature-name`
4. Create Pull Request for review
5. After approval, merge to main
6. CI/CD pipeline runs tests and deploys to staging

---

## 5. Testing Strategy

### Unit Tests
- **Framework:** Vitest
- **Coverage Target:** > 80%
- **Location:** `server/*.test.ts`, `client/src/**/*.test.ts`

### Test Categories

| Category | Tests | Coverage |
|----------|-------|----------|
| Authentication | Login, logout, JWT validation | 100% |
| Alerts | CRUD, status workflow, validation | 95% |
| Questions | Generation, filtering, validation | 90% |
| Paper Generation | Distribution calculation, selection | 95% |
| Watermarking | DWT-SVD application, verification | 85% |

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/auth.test.ts

# Run with coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

---

## 6. Deployment Pipeline

### CI/CD Workflow
```
Push to GitHub
    ↓
Run Tests (Vitest)
    ↓
TypeScript Check
    ↓
Lint Check (ESLint)
    ↓
Build Check
    ↓
Deploy to Staging
    ↓
Smoke Tests
    ↓
Approval Gate
    ↓
Deploy to Production
```

### Production Deployment
```bash
# Build production bundle
pnpm build

# Deploy to Cloud Run
gcloud run deploy omnishield-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated

# Run database migrations
pnpm drizzle-kit migrate --prod
```

---

## 7. Monitoring & Maintenance

### Key Metrics
- **Response Time:** p50, p95, p99 latencies
- **Error Rate:** 4xx, 5xx errors per minute
- **Database:** Query performance, connection pool usage
- **LLM Costs:** API calls, tokens used
- **User Activity:** Active sessions, feature usage

### Alerting Rules
- Error rate > 1%: Page on-call
- Response time p95 > 2s: Alert
- Database connection pool > 80%: Alert
- LLM API quota > 80%: Alert

### Maintenance Windows
- Weekly: Database optimization (OPTIMIZE TABLE)
- Monthly: Security patches and updates
- Quarterly: Full database backup verification
- Annually: Capacity planning and scaling review

---

## 8. Risk Management

### Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| LLM API rate limit | High | Medium | Implement queue, cache results |
| Database performance | High | Low | Index optimization, monitoring |
| Authentication bypass | Critical | Low | Security audit, penetration testing |
| Data loss | Critical | Very Low | Daily backups, disaster recovery |
| Watermark cracking | Medium | Low | Use robust DWT-SVD, monitor research |

### Contingency Plans
- **LLM Failure:** Fall back to cached questions or manual entry
- **Database Failure:** Restore from backup, activate read replica
- **Auth Failure:** Manual admin creation, session recovery
- **Watermark Failure:** Regenerate paper with new watermark

---

## 9. Success Criteria

### Functional Requirements
- [x] All 8 core features implemented
- [x] Admin dashboard fully functional
- [x] Alert workflow enforced
- [x] Question generation working
- [x] Paper watermarking applied
- [x] Authentication secure

### Non-Functional Requirements
- [ ] Dashboard load time < 2s
- [ ] Alert table renders 1000+ rows
- [ ] Question generation < 30s
- [ ] PDF download < 5s
- [ ] 99.5% uptime
- [ ] Zero critical security issues

### User Acceptance
- [ ] Admin users can complete all workflows
- [ ] UI/UX meets design specifications
- [ ] Documentation complete and clear
- [ ] Training completed for all users
- [ ] User satisfaction > 4.5/5

---

## 10. Post-Launch Activities

### Week 1 Post-Launch
- Monitor system performance
- Gather user feedback
- Fix critical bugs
- Optimize slow queries

### Month 1 Post-Launch
- Analyze usage patterns
- Identify feature improvements
- Plan Phase 2 enhancements
- Conduct security audit

### Ongoing
- Regular maintenance
- Performance optimization
- Feature enhancements
- User support

---
