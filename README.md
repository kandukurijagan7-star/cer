<div align="center">

# CertiFlow

### Digital Certificate Infrastructure for Organizations

**Create → Configure → Automate → Deliver → Verify → Track**

[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)

</div>

---

## The Problem

Organizations that issue certificates — colleges, hackathons, training institutes, corporate HR — spend **hundreds of hours** per year on manual certificate workflows:

1. Design a certificate for each award type
2. Manually fill in each recipient's name, team, and details
3. Generate individual PDFs
4. Send individual emails with attachments
5. Handle bounces, duplicates, and resends
6. Respond to "Is this certificate real?" verification requests

**CertiFlow eliminates all of that.**

A customer configures their certificate types, templates, and rules **once** — then the platform automatically generates, delivers, and verifies certificates for every future event.

> **Configure Once → Automate Forever**

---

## How It Works

```
Organization (e.g. SIMATS Engineering)
│
├── Event: SYNORA '26 Hackathon
│   ├── Certificate Type: Winner        → Rule: position = "Winner"     → Gold Template
│   ├── Certificate Type: Runner-Up     → Rule: position = "Runner-up"  → Silver Template
│   ├── Certificate Type: Participant   → Rule: (default)               → Standard Template
│   └── Certificate Type: Mentor        → Rule: category = "Mentor"     → Academic Template
│
├── Event: Faculty Workshop 2026
│   ├── Certificate Type: Completion    → Rule: attendance >= 75%
│   └── Certificate Type: Distinction   → Rule: score >= 90 AND attendance >= 80%
│
└── Event: Symposium 2027
    └── (Duplicate workflows from SYNORA '26 — zero configuration needed)
```

**Upload a participant roster → The platform automatically classifies each person, selects the right template, generates a unique PDF with embedded QR, sends a personalized email, and creates a tamper-proof verification record.**

No developer. No code changes. No manual work.

---

## Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CERTIFLOW PLATFORM                       │
│                                                              │
│  ┌──────────┐   ┌──────────────┐   ┌───────────────────┐   │
│  │  Multi-   │   │  Certificate │   │  Rule Engine       │   │
│  │  Tenant   │──▶│  Type System │──▶│  12 operators      │   │
│  │  Orgs     │   │  (configurable)│  │  AND/OR chaining   │   │
│  └──────────┘   └──────────────┘   └─────────┬─────────┘   │
│                                               │              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              WORKFLOW AUTOMATION ENGINE               │   │
│  │                                                       │   │
│  │  Trigger ──▶ Evaluate Rules ──▶ Select Template       │   │
│  │     ──▶ Generate PDF ──▶ Embed QR ──▶ Hash (SHA-256)  │   │
│  │     ──▶ Send Email ──▶ Log Execution ──▶ Analytics    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────┐   ┌──────────────┐   ┌───────────────────┐   │
│  │ Template  │   │  Email       │   │  Public Crypto    │   │
│  │ Builder   │   │  Campaign    │   │  Verification     │   │
│  │ (Canvas)  │   │  Engine      │   │  Portal           │   │
│  └──────────┘   └──────────────┘   └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Technology Stack:**
| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Next.js API Routes, Prisma ORM, PostgreSQL |
| PDF Engine | jsPDF + pdf-lib (deterministic vector A4 landscape) |
| Auth | JWT (HTTP-only cookies), bcrypt, RBAC (8 roles) |
| Verification | SHA-256 document checksums, nanoid tokens, QR codes |
| Legacy Bridge | Google Apps Script / Google Sheets sync adapter |

---

## Key Features

### 1. Configurable Certificate Types
Organizations define certificate categories through the UI — not code. Each type links to a visual template, personalized email template, required data fields, classification rules, and an optional admin-approval gate.

**Create a new certificate type in 30 seconds:**
- Click *"+ Create Certificate Type"*
- Name it (e.g. *"Best Innovator Award"*)
- Set the rule (e.g. `score >= 90`)
- Link a template and email
- Activate

No developer intervention required.

### 2. Rule Engine with 12 Operators
The built-in condition evaluator supports:

| Operator | Example |
|---|---|
| `equals` | `position == "Winner"` |
| `not_equals` | `category != "Staff"` |
| `greater_than` | `score > 85` |
| `greater_or_equal` | `attendance >= 75` |
| `less_than` | `score < 50` |
| `contains` | `institution contains "University"` |
| `starts_with` | `email starts_with "admin"` |
| `is_empty` / `is_not_empty` | Missing field checks |

Conditions chain with **AND / OR** logic:
```
score >= 90 AND attendance >= 80%  →  Distinction Certificate
position == "Winner"               →  Winner Certificate
(default)                          →  Participation Certificate
```

### 3. Visual Workflow Builder
A node-based **Trigger → Condition → Action** pipeline builder with live simulation:

- **Triggers:** `participant.imported`, `score.updated`, `manual.approval`, `api.request`
- **Conditions:** Any combination of rule engine operators
- **Actions:** Generate certificate, embed QR, send email, request approval, fire webhook

**Test before activating:** Enter sample attendee data and run a live simulation to see exactly which template the engine selects and what the certificate looks like — before processing real data.

### 4. Smart Bulk Import
Upload CSV/Excel or sync directly from Google Sheets. The platform:

1. **Auto-detects columns** — Fuzzy maps headers like `FULL NAME` → `recipient_name`, `RANK` → `position`, `COLLEGE` → `institution`
2. **Validates data** — Flags duplicates, invalid emails, and missing required fields
3. **Previews classification** — Shows which certificate type each person will receive *before* generation
4. **Triggers automation** — Fires workflow rules automatically on import

### 5. Step-by-Step Execution Audit Logs
Every automated action produces an immutable audit trail:

```
S Anudeep Sai (anudeep.sai@gmail.com)
  ✓ Participant detected           (participant.imported)
  ✓ Rule matched                   (position == "Winner")
  ✓ Template selected              (SYNORA '26 Gold Winner Template)
  ✓ Certificate generated          (ID: SYN26-000001, SHA-256 computed)
  ✓ QR code created                (linked to /verify/f49b291a)
  ✓ Email delivered                (250 OK)
  Execution time: 38ms
```

### 6. Certificate Approval Queue
High-value awards (e.g., Winner, Distinction) can require admin sign-off before public issuance. Staged certificates appear in the Approval Queue with recipient details, scores, and one-click **Approve & Issue** or **Reject** actions.

### 7. Public Cryptographic Verification
Every certificate gets a unique verification URL and QR code. Anyone — employers, universities, LinkedIn reviewers — can instantly verify authenticity:

- Certificate ID and recipient details
- SHA-256 binary document hash (tamper detection)
- Issuing organization and event
- Revocation status check
- Scan audit logging

### 8. Automation Impact & ROI Dashboard
Tracks the business value created by automation:
- Certificates automated
- Emails dispatched
- Manual hours saved (with dollar value estimate)
- Verification requests handled
- Delivery success rate

### 9. Multi-Tenant Organization Architecture
Complete data isolation between organizations. Each tenant has independent events, templates, workflows, certificates, team members, and billing.

### 10. Self-Service Onboarding
An 8-step interactive wizard gets new organizations from sign-up to their first issued certificate in under 5 minutes:

1. Account Setup → 2. Organization Profile → 3. First Event → 4. Template Selection → 5. Participant Data → 6. Automated Pipeline Run → 7. Certificate Preview → 8. Dashboard

---

## Platform Pages

### Customer Dashboard (17 pages)
| Page | Path | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Live KPIs, recent issuances, quick actions |
| Events | `/events` | Create and manage events |
| Certificate Types | `/certificate-types` | Configure award categories with rules |
| Automation Hub | `/automation` | Active workflows and ROI metrics |
| Workflow Builder | `/automation/builder` | Visual rule pipeline with live testing |
| Execution Logs | `/automation/logs` | Step-by-step audit trails |
| Approval Queue | `/approvals` | Review and approve staged certificates |
| Participants | `/participants` | Roster management with smart import |
| Template Builder | `/templates` | Visual canvas editor with versioning |
| Certificate Vault | `/certificates` | Search, download, revoke certificates |
| Email Campaigns | `/email-campaigns` | Dispatch queue and delivery status |
| Analytics | `/analytics` | BI metrics and institutional breakdown |
| Team & RBAC | `/team` | Member invites and role management |
| Billing | `/billing` | Plans, credits, invoices |
| Integrations | `/integrations` | API keys, webhooks, Google Sheets sync |
| Audit Logs | `/audit-logs` | Security compliance trail |
| Settings | `/settings` | Organization, white-label, custom domain |

### Public Pages (8 pages)
| Page | Path | Purpose |
|---|---|---|
| Landing Page | `/` | Product marketing with ROI calculator |
| Features | `/features` | Feature showcase |
| Solutions | `/solutions` | College, Hackathon, EdTech, Enterprise |
| Pricing | `/pricing` | Tiered plans (\$0 / \$29 / \$99 / \$299) |
| Enterprise | `/enterprise` | Custom SLA and VPC deployment |
| Security | `/security` | Cryptographic architecture |
| Contact | `/contact` | Sales and demo requests |
| Verify | `/verify/:id` | Public certificate verification |

### API (28 endpoints)
Full RESTful API under `/api/v1/` covering certificates, events, participants, templates, workflows, approvals, billing, analytics, verification, and health checks. See [API Documentation](docs/API.md).

---

## Database Schema (26 Models)

```
User ─── OrganizationMember ─── Organization ─── Plan
                                      │             │
                                   Event         Subscription
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                   │
             CertificateType    Workflow         CertificateTemplate
                    │                 │                   │
                    │          AutomationExecution   TemplateVersion
                    │
              Certificate ─── CertificateDelivery
                    │
              Verification
```

Plus: `EmailTemplate`, `EmailCampaign`, `DataMapping`, `AuditLog`, `Webhook`, `ApiKey`, `Notification`, `Usage`, `CreditPack`, `Invoice`, `Payment`

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/kandukurijagan7-star/cer.git
cd cer
npm install

# 2. Configure environment
cp .env.example .env
# Set DATABASE_URL and JWT_SECRET in .env

# 3. Initialize database
npx prisma db push
npx prisma generate

# 4. Seed demo data (SIMATS Engineering + SYNORA '26 + 3 certificate types + 10 certificates)
node scripts/seed.js

# 5. Run automated tests (11 tests covering rule engine, auto-selection, and verification)
npm test

# 6. Launch
npm run dev
# Open http://localhost:3000
```

**Demo Login:** `admin@certiflow.io` / `synora2026`

---

## Automated Test Suite

```
🧪 CertiFlow Workflow Automation & Rule Engine Test Suite

Test Group 1: Database & Certificate Types
  ✅ Super Admin user exists
  ✅ Database contains 3 configured Certificate Types
  ✅ Winner CertificateType requires admin approval

Test Group 2: Rule Engine Condition Evaluator
  ✅ Rule [position == "Winner"] evaluates TRUE for Winner attendee
  ✅ Multi-rule [score >= 90 AND attendance >= 80] evaluates TRUE
  ✅ Rule [category == "Mentor"] evaluates FALSE for Student attendee

Test Group 3: Dynamic Template Auto-Selection
  ✅ Winner attendee auto-assigned Winner template (no manual selection)
  ✅ Runner-up attendee auto-assigned Runner-Up template

Test Group 4: Smart Column Mapping
  ✅ CSV header fuzzy mapper auto-detects recipient_name and position

Test Group 5: Cryptographic Verification
  ✅ Certificate SYN26-000001 has valid 64-char SHA-256 hash
  ✅ Public verification lookup succeeds

Result: 11 Passed, 0 Failed
```

---

## Live Demo Flow (for Hiring Evaluation)

> **"I haven't changed a single line of code for this new certificate."**

1. **Configure a new certificate type** — Go to `/certificate-types`, click *Create*, name it *"Best Innovator Award"*, set rule `score >= 90`, link a template, and save.

2. **Test the workflow** — Open `/automation/builder`, enter sample data (`Score: 94, Position: Innovator`), click *Run Live Simulation Test*. Watch the engine select the correct template and generate a simulated certificate ID.

3. **Import participants** — Upload an Excel file at `/participants`. The system auto-maps columns, previews which certificate each person receives, and triggers automation.

4. **Inspect the audit trail** — Open `/automation/logs` to see step-by-step execution badges for every participant.

5. **Verify publicly** — Open `/verify/SYN26-000001` to see the cryptographic verification page with SHA-256 hash, issuer details, and revocation status.

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System topology, data flow, and cryptographic pipeline |
| [API Reference](docs/API.md) | All 28 REST endpoints with request/response schemas |
| [Database Schema](docs/DATABASE.md) | 26-model ERD and relationship descriptions |
| [Security Model](docs/SECURITY.md) | SHA-256 checksums, RBAC matrix, HTTP-only JWT |
| [Business Model](docs/BUSINESS_MODEL.md) | Pricing, unit economics, TAM, competitive analysis |
| [Deployment Guide](docs/DEPLOYMENT.md) | Vercel, Netlify, Node.js production setup |
| [Migration Guide](docs/MIGRATION.md) | Google Sheets → CertiFlow import path |

---

## Legacy Compatibility

The original SYNORA '26 single-page prototype (`index.html` + `code.gs`) is preserved in the repository. CertiFlow includes a dedicated **Google Sheets Migration API** (`/api/v1/migration/google-sheets`) that imports data from existing Apps Script endpoints, ensuring zero data loss during the transition from the legacy architecture to the new platform.

---

## Business Model

| Plan | Price | Certificates | Key Features |
|---|---|---|---|
| **Free** | \$0/mo | 50/mo | Basic templates, QR verification |
| **Starter** | \$29/mo | 500/mo | Custom templates, email automation, analytics |
| **Pro** | \$99/mo | 5,000/mo | Unlimited workflows, API access, webhooks, multi-admin |
| **Enterprise** | \$299/mo | 50,000/mo | White-label, custom domain, SSO, dedicated support |

Plus **pay-as-you-go credit packs** for seasonal usage spikes.

---

<div align="center">

**Built by [Jagan Kandukuri](https://github.com/kandukurijagan7-star)**

*CertiFlow — Configure Once, Automate Forever.*

</div>
