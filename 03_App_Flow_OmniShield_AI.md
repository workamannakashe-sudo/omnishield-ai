# App Flow Document
## OmniShield AI - Examination Integrity Platform

---

## 1. User Journey Overview

```
┌─────────────┐
│   Start     │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  Login Page      │
│  - Username      │
│  - Password      │
│  - Submit        │
└──────┬───────────┘
       │ (Auth Success)
       ▼
┌──────────────────────────────────────────┐
│         Admin Dashboard                   │
│  ┌────────────────────────────────────┐  │
│  │ Stats Cards:                       │  │
│  │ • Active Alerts (3)                │  │
│  │ • Question Banks (5)               │  │
│  │ • Upcoming Exams (2)               │  │
│  │                                    │  │
│  │ Quick Actions Menu                 │  │
│  │ • Review Alerts                    │  │
│  │ • Manage Questions                 │  │
│  │ • Review Flagged                   │  │
│  │ • Generate Paper                   │  │
│  └────────────────────────────────────┘  │
└──────┬───────────────────────────────────┘
       │
       ├─────────────────────────────────────────┐
       │                                         │
       ▼                                         ▼
┌──────────────────┐                  ┌──────────────────┐
│  Alerts Page     │                  │ Question Banks   │
│                  │                  │                  │
│ • Alert Table    │                  │ • Bank List      │
│ • Filter/Search  │                  │ • Create Bank    │
│ • Detail View    │                  │ • Edit Bank      │
│ • Status Update  │                  │ • Generate Q's   │
└──────────────────┘                  └──────────────────┘
       │                                         │
       ▼                                         ▼
┌──────────────────┐                  ┌──────────────────┐
│ Alert Details    │                  │ Flagged Q's      │
│                  │                  │                  │
│ • Full Content   │                  │ • Q List         │
│ • Confidence %   │                  │ • Flag Reason    │
│ • Status Flow    │                  │ • Approve/Reject │
│ • Move Status    │                  │ • Batch Actions  │
└──────────────────┘                  └──────────────────┘
                                              │
                                              ▼
                                      ┌──────────────────┐
                                      │ Paper Generator  │
                                      │                  │
                                      │ • Config Step    │
                                      │ • Preview Step   │
                                      │ • Download Step  │
                                      └──────────────────┘
```

---

## 2. Detailed Page Flows

### 2.1 Login Page Flow

**URL:** `/login`  
**Authentication Required:** No  
**Purpose:** Authenticate admin user

#### Page Elements
| Element | Type | Action |
|---------|------|--------|
| OmniShield Logo | Image | Display brand |
| Username Input | Text Field | Enter username |
| Password Input | Password Field | Enter password |
| Sign In Button | Button | Submit credentials |
| Demo Credentials Note | Text | Display demo credentials |
| Error Message | Alert | Show auth errors |

#### User Actions
1. User enters username (demo: "admin")
2. User enters password (demo: "admin123")
3. User clicks "Sign In" button
4. System validates credentials
5. If valid: Store JWT token, redirect to `/dashboard`
6. If invalid: Display error message, clear password field

#### Error Handling
- Invalid username: "Username not found"
- Invalid password: "Incorrect password"
- Server error: "Authentication failed"
- Network error: "Connection error"

#### Validation Rules
- Username: Required, 3-50 characters
- Password: Required, 8+ characters

---

### 2.2 Dashboard Page Flow

**URL:** `/dashboard`  
**Authentication Required:** Yes  
**Purpose:** Central command center with overview stats

#### Page Layout
```
┌─────────────────────────────────────────────────────┐
│ Header: Dashboard | User Profile | Logout           │
├─────────────────────────────────────────────────────┤
│ Sidebar Navigation                                   │
│ • Dashboard (active)                                │
│ • Leakage Alerts                                    │
│ • Question Banks                                    │
│ • Flagged Questions                                 │
│ • Paper Generator                                   │
├─────────────────────────────────────────────────────┤
│ Main Content Area                                    │
│                                                      │
│ H1: Dashboard                                        │
│ Subtitle: Welcome to OmniShield AI Administration   │
│                                                      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Active       │ │ Question     │ │ Upcoming     │ │
│ │ Alerts       │ │ Banks        │ │ Exams        │ │
│ │              │ │              │ │              │ │
│ │ 3            │ │ 5            │ │ 2            │ │
│ │              │ │              │ │              │ │
│ │ [View]       │ │ [Manage]     │ │ [Generate]   │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                      │
│ Quick Actions                                        │
│ [Review Alerts] [Manage Questions] [Review Flagged] │
│ [Generate Paper]                                     │
│                                                      │
│ System Status                                        │
│ • Leakage Detection: Active ●                       │
│ • Question Generation: Ready ●                      │
│ • Paper Watermarking: Operational ●                 │
└─────────────────────────────────────────────────────┘
```

#### User Interactions
| Action | Destination | Effect |
|--------|-------------|--------|
| Click "View Alerts" | `/alerts` | Navigate to alerts page |
| Click "Manage Banks" | `/question-banks` | Navigate to banks page |
| Click "Review Flagged" | `/flagged-questions` | Navigate to flagged page |
| Click "Generate Paper" | `/paper-generator` | Navigate to generator |
| Click Sidebar Item | Various | Navigate to section |
| Click "Logout" | `/login` | Clear session, redirect |

#### Data Loading
- On page load: Fetch dashboard stats via `dashboard.getStats`
- Display loading skeleton while fetching
- Cache stats for 30 seconds
- Show error state if fetch fails

---

### 2.3 Alerts Page Flow

**URL:** `/alerts`  
**Authentication Required:** Yes  
**Purpose:** Monitor and manage leakage incidents

#### Page Layout
```
┌─────────────────────────────────────────────────────┐
│ Header: Leakage Alerts                              │
│ Subtitle: Monitor and manage detected information   │
├─────────────────────────────────────────────────────┤
│ Filters Section                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Search: [Search by content or channel...   ]   │ │
│ │ Status: [All Statuses ▼]                      │ │
│ │ [Clear Filters]                               │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Alerts Table                                         │
│ ┌────────────────────────────────────────────────┐ │
│ │ Source | Content | Confidence | Time | Status │ │
│ ├────────────────────────────────────────────────┤ │
│ │ Telegram | NEET... | 95% | 14:32 | New | ► │ │
│ │ WhatsApp | Chem... | 87% | 12:15 | Inv | ► │ │
│ │ Dark Web | Med... | 92% | 23:45 | Res | ► │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Alert Detail Panel (when row selected)              │
│ ┌────────────────────────────────────────────────┐ │
│ │ Alert Details                              [×] │ │
│ │                                                │ │
│ │ Source Channel: Telegram                      │ │
│ │ Detected Content: [Full text...]              │ │
│ │ Confidence: ████████░░ 95%                    │ │
│ │ Status: New                                   │ │
│ │ Timestamp: 2026-06-08 14:32                   │ │
│ │                                                │ │
│ │ [Move to Investigating]                       │ │
│ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### User Workflows

**Workflow 1: View All Alerts**
1. Click "Leakage Alerts" in sidebar
2. Page loads with all alerts in table
3. Alerts sorted by timestamp (newest first)
4. Each row shows: source, content preview, confidence, time, status

**Workflow 2: Filter Alerts by Status**
1. Click Status dropdown
2. Select "New" / "Investigating" / "Resolved"
3. Table updates to show only selected status
4. Click "Clear Filters" to reset

**Workflow 3: Search Alerts**
1. Type in search box
2. Filter by content or channel name
3. Results update in real-time
4. Clear search to show all

**Workflow 4: Update Alert Status**
1. Click alert row to expand details
2. Review full content and metadata
3. Click "Move to Investigating" button
4. Status changes from "New" → "Investigating"
5. Next time, button shows "Move to Resolved"
6. Cannot skip steps (New → Investigating → Resolved)

#### Status Workflow Enforcement
```
┌─────┐    ┌──────────────┐    ┌──────────┐
│ New │ → │ Investigating │ → │ Resolved │
└─────┘    └──────────────┘    └──────────┘
  ↑              ↑                   ↑
  └──────────────┴───────────────────┘
  (No backward movement allowed)
```

---

### 2.4 Question Banks Page Flow

**URL:** `/question-banks`  
**Authentication Required:** Yes  
**Purpose:** Create and manage question collections

#### Page Layout
```
┌─────────────────────────────────────────────────────┐
│ Header: Question Banks                              │
│ Subtitle: Create and manage examination collections │
├─────────────────────────────────────────────────────┤
│ [+ Create New Bank]                                 │
│                                                      │
│ Question Banks Grid                                  │
│ ┌──────────────────┐ ┌──────────────────┐          │
│ │ NEET Biology     │ │ AIIMS Chemistry  │          │
│ │ 2026             │ │                  │          │
│ │ Biology          │ │ Chemistry        │          │
│ │                  │ │                  │          │
│ │ Questions: 150   │ │ Questions: 120   │          │
│ │ Created: 5/15    │ │ Created: 5/20    │          │
│ │                  │ │                  │          │
│ │ [View Questions] │ │ [View Questions] │          │
│ │ [Generate]       │ │ [Generate]       │          │
│ └──────────────────┘ └──────────────────┘          │
│ ┌──────────────────┐                                │
│ │ Medical Anatomy  │                                │
│ │                  │                                │
│ │ Anatomy          │                                │
│ │                  │                                │
│ │ Questions: 200   │                                │
│ │ Created: 6/01    │                                │
│ │                  │                                │
│ │ [View Questions] │                                │
│ │ [Generate]       │                                │
│ └──────────────────┘                                │
└─────────────────────────────────────────────────────┘
```

#### User Workflows

**Workflow 1: Create Question Bank**
1. Click "[+ Create New Bank]" button
2. Form appears with fields:
   - Bank Name: "NEET Biology 2026"
   - Subject: "Biology"
3. Click "Create Bank" button
4. Bank added to grid
5. Form closes

**Workflow 2: View Questions in Bank**
1. Click "[View Questions]" on bank card
2. Navigate to `/question-banks/{bankId}`
3. Display list of all questions in bank
4. Show difficulty tags (Easy/Medium/Hard)
5. Show question text preview

**Workflow 3: Generate Questions**
1. Click "[Generate]" on bank card
2. Navigate to question generation flow
3. Specify count and difficulty
4. LLM generates questions
5. Questions added to bank
6. Return to banks page

---

### 2.5 Flagged Questions Page Flow

**URL:** `/flagged-questions`  
**Authentication Required:** Yes  
**Purpose:** Review and approve AI-generated questions

#### Page Layout
```
┌─────────────────────────────────────────────────────┐
│ Header: Flagged Questions Review                    │
│ Subtitle: Review and approve flagged questions      │
├─────────────────────────────────────────────────────┤
│ Alert: 2 questions pending review                   │
│                                                      │
│ Flagged Questions List                              │
│ ┌────────────────────────────────────────────────┐ │
│ │ Which of the following is the primary...       │ │
│ │ [Pending Review] 2026-06-08 10:30              │ │
│ │                                                 │ │
│ │ Flag Reason:                                    │ │
│ │ Dual-Agent Discrepancy: Factual inconsistency  │ │
│ │                                                 │ │
│ │ [Approve] [Reject]                             │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ The structure of DNA was discovered by...      │ │
│ │ [Pending Review] 2026-06-07 15:45              │ │
│ │                                                 │ │
│ │ Flag Reason:                                    │ │
│ │ High similarity match with coaching material   │ │
│ │                                                 │ │
│ │ [Approve] [Reject]                             │ │
│ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### User Workflows

**Workflow 1: Review Flagged Question**
1. Page displays list of flagged questions
2. Each question shows:
   - Question text
   - Status badge (Pending Review)
   - Timestamp
   - Flag reason
3. Admin reads flag reason
4. Decides to approve or reject

**Workflow 2: Approve Question**
1. Click "[Approve]" button
2. Status changes to "Approved"
3. Question added to question bank
4. Question removed from pending list
5. Next flagged question displays

**Workflow 3: Reject Question**
1. Click "[Reject]" button
2. Status changes to "Rejected"
3. Question marked for regeneration
4. Question removed from pending list
5. Next flagged question displays

---

### 2.6 Paper Generator Page Flow

**URL:** `/paper-generator`  
**Authentication Required:** Yes  
**Purpose:** Create secure, watermarked exam papers

#### Page Layout - Step 1: Configuration

```
┌─────────────────────────────────────────────────────┐
│ Header: Examination Paper Generator                 │
│ Subtitle: Create, preview, and download papers      │
├─────────────────────────────────────────────────────┤
│ Progress: ● Step 1 — ○ Step 2 — ○ Step 3           │
│                                                      │
│ Paper Configuration                                  │
│ ┌────────────────────────────────────────────────┐ │
│ │ Question Bank:                                 │ │
│ │ [NEET Biology 2026 ▼]                          │ │
│ │                                                 │ │
│ │ Exam Title:                                     │ │
│ │ [Medical Entrance Examination     ]             │ │
│ │                                                 │ │
│ │ Number of Questions:                            │ │
│ │ [═══════════════] 180                           │ │
│ │                                                 │ │
│ │ Difficulty Distribution:                        │ │
│ │                                                 │ │
│ │ Easy Questions:     30%                         │ │
│ │ [═══════════════]                               │ │
│ │                                                 │ │
│ │ Medium Questions:   50%                         │ │
│ │ [═════════════════════════════]                 │ │
│ │                                                 │ │
│ │ Hard Questions:     20%                         │ │
│ │ [═══════════════]                               │ │
│ │                                                 │ │
│ │ Total: 100% ✓                                   │ │
│ │                                                 │ │
│ │ [Generate Paper]                                │ │
│ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### Page Layout - Step 2: Preview

```
┌─────────────────────────────────────────────────────┐
│ Progress: ● Step 1 ● Step 2 — ○ Step 3              │
│                                                      │
│ Paper Preview                                        │
│ ┌────────────────────────────────────────────────┐ │
│ │ Total: 180 | Easy: 54 | Medium: 90 | Hard: 36 │ │
│ │                                                 │ │
│ │ Questions Preview (showing first 10):           │ │
│ │                                                 │ │
│ │ 1. Easy Question 1                              │ │
│ │    [Easy]                                        │ │
│ │                                                 │ │
│ │ 2. Easy Question 2                              │ │
│ │    [Easy]                                        │ │
│ │                                                 │ │
│ │ ... and 170 more questions                      │ │
│ │                                                 │ │
│ │ [Back to Configuration] [Download with Mark]   │ │
│ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### Page Layout - Step 3: Download Complete

```
┌─────────────────────────────────────────────────────┐
│ Progress: ● Step 1 ● Step 2 ● Step 3                │
│                                                      │
│ Paper Generated Successfully                         │
│                                                      │
│ 📄                                                   │
│                                                      │
│ Your watermarked examination paper has been          │
│ generated and downloaded                             │
│                                                      │
│ Watermarking: DWT-SVD Applied                        │
│ Format: PDF                                          │
│ Status: Ready for Use                                │
│                                                      │
│ [Generate Another Paper]                            │
└─────────────────────────────────────────────────────┘
```

#### User Workflows

**Workflow 1: Configure Paper**
1. Select question bank from dropdown
2. Enter exam title
3. Set total question count (10-200)
4. Adjust difficulty sliders:
   - Easy: 0-100%
   - Medium: 0-100%
   - Hard: 0-100%
   - (Must sum to 100%)
5. Click "Generate Paper"
6. Proceed to preview step

**Workflow 2: Preview Paper**
1. Review question distribution stats
2. Scroll through first 10 questions
3. Verify difficulty distribution
4. Click "Back to Configuration" to adjust
5. Or click "Download with Watermark" to proceed

**Workflow 3: Download Paper**
1. System applies DWT-SVD watermark
2. Generates PDF with embedded watermark
3. PDF automatically downloads
4. Display success message
5. Offer option to generate another paper

---

## 3. Navigation Map

```
Login (/login)
    │
    ├─→ Dashboard (/dashboard)
    │       │
    │       ├─→ Alerts (/alerts)
    │       │       └─→ Alert Details (inline)
    │       │
    │       ├─→ Question Banks (/question-banks)
    │       │       └─→ Bank Questions (/question-banks/{id})
    │       │
    │       ├─→ Flagged Questions (/flagged-questions)
    │       │
    │       └─→ Paper Generator (/paper-generator)
    │               ├─→ Step 1: Configuration
    │               ├─→ Step 2: Preview
    │               └─→ Step 3: Download
    │
    └─→ Logout (returns to /login)
```

---

## 4. Error Handling Flows

### Network Error
```
User Action → Request → Network Error
                            ↓
                    Show Error Toast
                    "Connection failed"
                            ↓
                    Offer "Retry" button
```

### Authentication Error
```
User Action → Request → 401 Unauthorized
                            ↓
                    Clear session
                    Redirect to /login
                    Show message
```

### Validation Error
```
User Input → Validation → Error
                            ↓
                    Highlight invalid field
                    Show error message
                    Focus on field
```

---
