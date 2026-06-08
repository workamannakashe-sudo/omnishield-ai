# Backend Schema Document
## OmniShield AI - Examination Integrity Platform

---

## 1. Database Overview

**Database Engine:** MySQL 8.0+  
**ORM:** Drizzle ORM  
**Connection:** MySQL2 driver  
**Total Tables:** 8  
**Relationships:** Foreign keys with cascade rules  
**Indexing:** Optimized for query performance

---

## 2. Complete Schema Definition

### Table 1: admins

**Purpose:** Store admin user accounts with authentication credentials

```sql
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role ENUM('admin', 'superadmin') DEFAULT 'admin',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastLogin TIMESTAMP,
  isActive BOOLEAN DEFAULT TRUE,
  INDEX idx_username (username),
  INDEX idx_email (email)
);
```

**Columns:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| passwordHash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Contact email |
| role | ENUM | DEFAULT 'admin' | Permission level |
| createdAt | TIMESTAMP | DEFAULT NOW | Account creation time |
| lastLogin | TIMESTAMP | NULL | Last login timestamp |
| isActive | BOOLEAN | DEFAULT TRUE | Account status |

**Indexes:**
- `idx_username`: Speed up login queries
- `idx_email`: Speed up email lookups

---

### Table 2: alerts

**Purpose:** Store leakage detection records with confidence scores

```sql
CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adminId INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sourceChannel VARCHAR(50) NOT NULL,
  detectedContent TEXT NOT NULL,
  confidenceScore DECIMAL(5,2) NOT NULL,
  status ENUM('New', 'Investigating', 'Resolved') DEFAULT 'New',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (adminId) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_timestamp (timestamp),
  INDEX idx_sourceChannel (sourceChannel)
);
```

**Columns:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| adminId | INT | FK → admins.id | Admin who created alert |
| timestamp | TIMESTAMP | NOT NULL | Alert detection time |
| sourceChannel | VARCHAR(50) | NOT NULL | Source (Telegram, WhatsApp, etc.) |
| detectedContent | TEXT | NOT NULL | Full leaked content |
| confidenceScore | DECIMAL(5,2) | NOT NULL | Confidence 0.00-100.00 |
| status | ENUM | DEFAULT 'New' | Workflow status |
| createdAt | TIMESTAMP | DEFAULT NOW | Record creation |
| updatedAt | TIMESTAMP | DEFAULT NOW | Last update |

**Indexes:**
- `idx_status`: Filter by status
- `idx_timestamp`: Sort by time
- `idx_sourceChannel`: Filter by source

**Status Workflow:**
```
New → Investigating → Resolved
(No backward movement allowed)
```

---

### Table 3: alertDetails

**Purpose:** Store extended context and metadata for each alert

```sql
CREATE TABLE alertDetails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alertId INT NOT NULL UNIQUE,
  fullContent TEXT,
  context TEXT,
  mediaUrl VARCHAR(255),
  additionalMetadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alertId) REFERENCES alerts(id) ON DELETE CASCADE,
  INDEX idx_alertId (alertId)
);
```

**Columns:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| alertId | INT | FK → alerts.id, UNIQUE | Parent alert |
| fullContent | TEXT | NULL | Complete leaked content |
| context | TEXT | NULL | Surrounding context |
| mediaUrl | VARCHAR(255) | NULL | URL to leaked media |
| additionalMetadata | JSON | NULL | Extra data (flexible) |
| createdAt | TIMESTAMP | DEFAULT NOW | Record creation |

**Relationship:**
- One-to-one with alerts table
- Cascade delete: Deleting alert deletes details

---

### Table 4: questionBanks

**Purpose:** Organize questions by subject and exam type

```sql
CREATE TABLE questionBanks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adminId INT,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  isActive BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (adminId) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_subject (subject),
  INDEX idx_adminId (adminId),
  INDEX idx_isActive (isActive)
);
```

**Columns:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| adminId | INT | FK → admins.id | Creator admin |
| name | VARCHAR(100) | NOT NULL | Bank name |
| subject | VARCHAR(50) | NOT NULL | Subject area |
| description | TEXT | NULL | Bank description |
| createdAt | TIMESTAMP | DEFAULT NOW | Creation time |
| lastModified | TIMESTAMP | DEFAULT NOW | Last update |
| isActive | BOOLEAN | DEFAULT TRUE | Active status |

**Indexes:**
- `idx_subject`: Filter by subject
- `idx_adminId`: Find banks by creator
- `idx_isActive`: Filter active banks

---

### Table 5: questions

**Purpose:** Store individual exam questions with metadata

```sql
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  questionBankId INT NOT NULL,
  questionText TEXT NOT NULL,
  options JSON NOT NULL,
  correctAnswer VARCHAR(255) NOT NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
  source ENUM('Synthetic', 'Human-authored') NOT NULL,
  watermarkId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (questionBankId) REFERENCES questionBanks(id) ON DELETE CASCADE,
  FOREIGN KEY (watermarkId) REFERENCES watermarks(id) ON DELETE SET NULL,
  INDEX idx_questionBankId (questionBankId),
  INDEX idx_difficulty (difficulty),
  INDEX idx_source (source)
);
```

**Columns:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| questionBankId | INT | FK → questionBanks.id | Parent bank |
| questionText | TEXT | NOT NULL | Question content |
| options | JSON | NOT NULL | Multiple choice options |
| correctAnswer | VARCHAR(255) | NOT NULL | Correct option |
| difficulty | ENUM | NOT NULL | Easy/Medium/Hard |
| source | ENUM | NOT NULL | Synthetic or Human |
| watermarkId | INT | FK → watermarks.id | Applied watermark |
| createdAt | TIMESTAMP | DEFAULT NOW | Creation time |

**JSON Structure for options:**
```json
{
  "A": "Option A text",
  "B": "Option B text",
  "C": "Option C text",
  "D": "Option D text"
}
```

**Indexes:**
- `idx_questionBankId`: Find questions in bank
- `idx_difficulty`: Filter by difficulty
- `idx_source`: Filter by source type

---

### Table 6: flaggedQuestions

**Purpose:** Track questions pending human review

```sql
CREATE TABLE flaggedQuestions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  questionId INT UNIQUE NOT NULL,
  flaggedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT NOT NULL,
  status ENUM('Pending Review', 'Approved', 'Rejected') DEFAULT 'Pending Review',
  reviewedByAdminId INT,
  reviewedAt TIMESTAMP,
  reviewNotes TEXT,
  FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewedByAdminId) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_reviewedByAdminId (reviewedByAdminId),
  INDEX idx_flaggedAt (flaggedAt)
);
```

**Columns:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| questionId | INT | FK → questions.id, UNIQUE | Flagged question |
| flaggedAt | TIMESTAMP | DEFAULT NOW | Flag creation time |
| reason | TEXT | NOT NULL | Why flagged |
| status | ENUM | DEFAULT 'Pending' | Review status |
| reviewedByAdminId | INT | FK → admins.id | Reviewing admin |
| reviewedAt | TIMESTAMP | NULL | Review completion time |
| reviewNotes | TEXT | NULL | Admin review notes |

**Flag Reasons:**
- "Dual-Agent Discrepancy: Factual inconsistency"
- "High similarity match with coaching material"
- "Hallucination detected in answer"
- "Ambiguous question wording"
- "Factual error in question"

**Indexes:**
- `idx_status`: Filter by review status
- `idx_reviewedByAdminId`: Find reviews by admin
- `idx_flaggedAt`: Sort by flag time

---

### Table 7: examinations

**Purpose:** Store generated exam papers with metadata

```sql
CREATE TABLE examinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  questionBankId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  examDate TIMESTAMP,
  durationMinutes INT NOT NULL,
  totalQuestions INT NOT NULL,
  easyCount INT NOT NULL,
  mediumCount INT NOT NULL,
  hardCount INT NOT NULL,
  status ENUM('Draft', 'Scheduled', 'Active', 'Completed') DEFAULT 'Draft',
  generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  watermarkedPaperUrl VARCHAR(255),
  watermarkId INT,
  createdByAdminId INT,
  FOREIGN KEY (questionBankId) REFERENCES questionBanks(id) ON DELETE CASCADE,
  FOREIGN KEY (watermarkId) REFERENCES watermarks(id) ON DELETE SET NULL,
  FOREIGN KEY (createdByAdminId) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_questionBankId (questionBankId),
  INDEX idx_examDate (examDate)
);
```

**Columns:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| questionBankId | INT | FK → questionBanks.id | Source bank |
| title | VARCHAR(255) | NOT NULL | Exam title |
| examDate | TIMESTAMP | NULL | Scheduled exam date |
| durationMinutes | INT | NOT NULL | Exam duration |
| totalQuestions | INT | NOT NULL | Total question count |
| easyCount | INT | NOT NULL | Easy questions count |
| mediumCount | INT | NOT NULL | Medium questions count |
| hardCount | INT | NOT NULL | Hard questions count |
| status | ENUM | DEFAULT 'Draft' | Exam status |
| generatedAt | TIMESTAMP | DEFAULT NOW | Generation time |
| watermarkedPaperUrl | VARCHAR(255) | NULL | PDF download URL |
| watermarkId | INT | FK → watermarks.id | Applied watermark |
| createdByAdminId | INT | FK → admins.id | Creator admin |

**Status Workflow:**
```
Draft → Scheduled → Active → Completed
```

**Indexes:**
- `idx_status`: Filter by status
- `idx_questionBankId`: Find exams from bank
- `idx_examDate`: Sort by exam date

---

### Table 8: watermarks

**Purpose:** Track watermark metadata and application records

```sql
CREATE TABLE watermarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scheme VARCHAR(50) NOT NULL,
  algorithm VARCHAR(50) NOT NULL,
  metadata JSON,
  appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  appliedByAdminId INT,
  FOREIGN KEY (appliedByAdminId) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_scheme (scheme),
  INDEX idx_appliedAt (appliedAt)
);
```

**Columns:**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| scheme | VARCHAR(50) | NOT NULL | Watermark type |
| algorithm | VARCHAR(50) | NOT NULL | Algorithm used |
| metadata | JSON | NULL | Watermark parameters |
| appliedAt | TIMESTAMP | DEFAULT NOW | Application time |
| appliedByAdminId | INT | FK → admins.id | Admin who applied |

**Watermark Schemes:**
- `DWT-SVD`: Discrete Wavelet Transform + Singular Value Decomposition
- `LSB`: Least Significant Bit embedding
- `Steganography`: Image-based steganography

**Metadata Example:**
```json
{
  "dwt_level": 3,
  "svd_strength": 0.5,
  "robustness": "high",
  "invisibility": "high"
}
```

**Indexes:**
- `idx_scheme`: Filter by scheme type
- `idx_appliedAt`: Sort by application time

---

## 3. Relationships Diagram

```
admins (1)
  ├─── (N) alerts
  │      └─── (1) alertDetails
  ├─── (N) questionBanks
  │      └─── (N) questions
  │             └─── (1) watermarks
  ├─── (N) examinations
  │      └─── (1) watermarks
  ├─── (N) flaggedQuestions
  └─── (N) watermarks
```

---

## 4. Query Patterns

### Common Queries

**Get all alerts for a specific admin:**
```sql
SELECT * FROM alerts 
WHERE adminId = ? 
ORDER BY timestamp DESC 
LIMIT 50;
```

**Get questions in a bank by difficulty:**
```sql
SELECT * FROM questions 
WHERE questionBankId = ? AND difficulty = ? 
ORDER BY createdAt DESC;
```

**Get pending flagged questions:**
```sql
SELECT fq.*, q.questionText, q.difficulty
FROM flaggedQuestions fq
JOIN questions q ON fq.questionId = q.id
WHERE fq.status = 'Pending Review'
ORDER BY fq.flaggedAt DESC;
```

**Get exam paper with all questions:**
```sql
SELECT e.*, q.*
FROM examinations e
JOIN questions q ON q.questionBankId = e.questionBankId
WHERE e.id = ?
ORDER BY q.difficulty, q.createdAt;
```

**Count alerts by status:**
```sql
SELECT status, COUNT(*) as count
FROM alerts
GROUP BY status;
```

---

## 5. Indexes Strategy

### Primary Indexes
- **admins.id:** Primary key (auto-indexed)
- **alerts.id:** Primary key (auto-indexed)
- **questions.id:** Primary key (auto-indexed)

### Foreign Key Indexes
- **alerts.adminId:** Speed up joins
- **questions.questionBankId:** Speed up joins
- **flaggedQuestions.questionId:** Speed up joins
- **examinations.questionBankId:** Speed up joins

### Filter Indexes
- **alerts.status:** Filter by status (New/Investigating/Resolved)
- **alerts.sourceChannel:** Filter by channel
- **questions.difficulty:** Filter by difficulty
- **questions.source:** Filter by source type
- **flaggedQuestions.status:** Filter by review status
- **examinations.status:** Filter by exam status

### Sort Indexes
- **alerts.timestamp:** Sort alerts chronologically
- **questions.createdAt:** Sort questions by creation
- **flaggedQuestions.flaggedAt:** Sort by flag time
- **examinations.examDate:** Sort by exam date

---

## 6. Data Validation Rules

### admins Table
- `username`: 3-50 characters, alphanumeric + underscore
- `passwordHash`: 60 characters (bcrypt)
- `email`: Valid email format
- `role`: Must be 'admin' or 'superadmin'

### alerts Table
- `sourceChannel`: Max 50 characters
- `detectedContent`: Required, non-empty
- `confidenceScore`: 0.00 to 100.00
- `status`: Must follow workflow (New → Investigating → Resolved)

### questions Table
- `questionText`: Required, non-empty
- `options`: Valid JSON with 4 options (A, B, C, D)
- `correctAnswer`: Must match one of the options
- `difficulty`: Must be Easy, Medium, or Hard

### examinations Table
- `title`: Required, 1-255 characters
- `durationMinutes`: Positive integer
- `totalQuestions`: Must equal easyCount + mediumCount + hardCount
- `easyCount + mediumCount + hardCount = totalQuestions`

---

## 7. Performance Optimization

### Query Optimization
- Use indexed columns in WHERE clauses
- Limit result sets with LIMIT and OFFSET
- Use JOIN instead of multiple queries
- Aggregate functions (COUNT, SUM) on indexed columns

### Connection Pooling
- MySQL2 connection pool: min 2, max 10 connections
- Connection timeout: 30 seconds
- Idle timeout: 60 seconds

### Caching Strategy
- Cache dashboard stats (30 second TTL)
- Cache question bank list (5 minute TTL)
- Cache admin user data (10 minute TTL)
- Cache exam paper data (read-only after generation)

### Database Maintenance
- Weekly OPTIMIZE TABLE on large tables
- Monthly ANALYZE TABLE for statistics
- Quarterly backup and verification
- Monitor slow query log (> 1 second)

---

## 8. Backup & Recovery

### Backup Strategy
- **Frequency:** Daily automated backups
- **Retention:** 30-day rolling window
- **Location:** Encrypted cloud storage
- **Verification:** Weekly restore tests

### Recovery Procedures
- **Point-in-time recovery:** Up to 30 days
- **Table-level recovery:** Restore individual tables
- **Full database recovery:** Complete restore from backup
- **RTO:** 1 hour, **RPO:** 1 hour

---

## 9. Security Considerations

### Access Control
- All admin access logged with timestamps
- Sensitive operations require admin role
- Password changes require current password
- Session tokens expire after 24 hours

### Data Protection
- All passwords hashed with bcrypt (cost 12)
- Sensitive data encrypted at rest
- HTTPS-only communication
- SQL injection prevention via parameterized queries

### Audit Trail
- All admin actions logged
- Alert status changes tracked
- Question approvals/rejections logged
- Paper generation recorded with admin ID

---

## 10. Scalability Considerations

### Current Capacity
- Supports 1000+ concurrent users
- Handles 10,000+ alerts per day
- Stores 100,000+ questions
- Generates 1000+ papers per month

### Future Scaling
- Horizontal scaling: Read replicas for queries
- Vertical scaling: Larger database instance
- Sharding: Partition by institution/year
- Archive: Move old alerts to separate table

---
