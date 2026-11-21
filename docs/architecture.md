# System Architecture

## Overview

**TrueHire** (repository root `career-lens-monorepo`) is a full-stack TypeScript career readiness and technical interview preparation platform built around a closed-loop workflow: candidates upload or paste a resume, discover verified software engineering postings synced from public ATS boards, inspect deterministic skill-gap coverage and role-fit rankings, tailor resume bullets with evidence bounds, run adaptive AI mock interviews, and persist verified or weak skill evidence back into their readiness profile.

![Dashboard Overview](./images/dashboard.png)

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend (`client/`)** | React 18, TypeScript 5, Vite 5, Tailwind CSS 3, React Router 6, TanStack React Query 5, React Hook Form + Zod, Lucide React, Framer Motion |
| **Backend (`server/`)** | Node.js 20, Express 4, TypeScript 5, Prisma ORM 5, Zod, Helmet, CORS, Express Rate Limit, Multer, `pdf-parse`, `mammoth`, `bcryptjs`, `jsonwebtoken` |
| **Database** | PostgreSQL 15 (managed via Prisma schema & forward SQL migrations) |
| **AI Provider Router** | OpenAI-compatible SDK (`openai` v7) routing across Groq, NVIDIA NIM, Google Gemini, or local Ollama with automatic failover and JSON repair |
| **Job Ingestion** | Greenhouse public board API + Lever/Ashby connectors + external manual job import |
| **Observability & Testing** | Vitest (unit & integration), Supertest, Playwright (E2E), optional Sentry (`@sentry/react` / `@sentry/node` hooks via `SENTRY_DSN` / `VITE_SENTRY_DSN`), built-in Admin Operations Console |

## Folder Structure

```text
.
├── client/                     # React + Vite SPA
│   ├── src/
│   │   ├── components/         # Shared UI primitives, ErrorBoundary, AppShell, Sidebar, TopNav, CommandPalette
│   │   ├── features/           # Domain-sliced modules:
│   │   │   ├── admin/          #   Admin Operations Console (/admin)
│   │   │   ├── auth/           #   AuthContext, ProtectedRoute, Login/Register, Onboarding, Profile
│   │   │   ├── dashboard/      #   Candidate Readiness Overview (/dashboard)
│   │   │   ├── interview/      #   Prep, Live Interview, Evaluation + Markdown export (/interviews/*)
│   │   │   ├── jobs/           #   Verified Jobs Explorer & Saved Jobs (/jobs, /saved-jobs)
│   │   │   ├── landing/        #   Public marketing & workflow preview (/)
│   │   │   ├── matching/       #   Match breakdown & Skill Gap simulator (/matches/:jobId, /skill-gaps/:jobId)
│   │   │   ├── ontology/       #   Skill Ontology diagnostics & admin alias review (/ontology)
│   │   │   ├── radar/          #   Role-Fit Radar rankings (/radar)
│   │   │   ├── readiness/      #   Skill Readiness Ledger & proof submission (/readiness)
│   │   │   ├── resume/         #   Resume upload/paste, parsing & section editor (/resume)
│   │   │   ├── tailoring/      #   Evidence-bounded resume tailoring (/tailor/:jobId)
│   │   │   └── tracker/        #   Application pipeline Kanban/list tracker (/applications)
│   │   ├── lib/                # apiClient (token rotation), sanitize (HTML/URL allowlist), Sentry init
│   │   ├── services/           # Auth API helpers
│   │   └── __tests__/          # Client unit tests (Vitest)
│   └── tests/e2e/              # End-to-end Playwright specs & fixtures
├── server/                     # Express + Prisma REST API
│   ├── prisma/
│   │   ├── migrations/         # PostgreSQL SQL migrations (including schema/observability sync)
│   │   ├── schema.prisma       # Authoritative relational data model (14 models)
│   │   └── seed.ts             # Local development seed script
│   └── src/
│       ├── config/             # Zod env validation + fail-closed prod checks, Prisma client, Sentry
│       ├── controllers/        # HTTP request/response handlers
│       ├── integrations/       # Multi-provider AI client + telemetry; Greenhouse/Lever/Ashby clients
│       ├── middleware/         # JWT auth, RBAC requireRole, rate limiters, Multer upload validation
│       ├── modules/            # Interview prompts, Zod output schemas, adaptive evaluator
│       ├── repositories/       # Prisma persistence queries & transactional writes
│       ├── routes/             # Canonical /api/* Express routers (10 domain modules)
│       ├── services/           # Business logic (auth, resume, matching, ontology, radar, readiness, interviews, admin)
│       ├── utils/              # AppError, JWT access/refresh signing, resilient LLM JSON parser
│       └── __tests__/          # Backend Vitest suites (15 test files)
├── docs/                       # Production documentation and UI screenshots
├── .github/workflows/          # CI, CD, and Playwright E2E pipelines
├── docker-compose.yml          # Local PostgreSQL 15 service
└── render.yaml                 # Render backend deployment blueprint
```

## System Architecture Diagram

```mermaid
flowchart LR
    Browser["React SPA (Vite + React Query)\nPort 3000 (dev) / Vercel (prod)"]
    API["Express 4 REST API\nPort 5000 / Render"]
    AuthMW["Helmet + CORS + Rate Limit\nJWT Auth + RBAC"]
    Services["Domain Services\nResume · Matching · Ontology\nRadar · Tailoring · Interviews · Readiness"]
    AI["Multi-Provider AI Router\nGroq · NVIDIA · Gemini · Ollama"]
    ATS["ATS Connectors\nGreenhouse · Lever · Ashby"]
    DB[("PostgreSQL 15\nPrisma ORM")]

    Browser -- "HTTPS JSON + Bearer JWT\n(Auto refresh rotation)" --> API
    API --> AuthMW --> Services
    Services <--> DB
    Services -- "Structured JSON Prompts\nFailover + Telemetry" --> AI
    Services -- "Scheduled / Admin Sync\nSlug-validated + Timeout" --> ATS
```

## Core Closed-Loop User Flow

```mermaid
sequenceDiagram
    actor Candidate
    participant SPA as React SPA
    participant API as Express API
    participant DB as PostgreSQL
    participant AI as AI Provider Router

    Candidate->>SPA: Upload PDF/DOCX or paste resume
    SPA->>API: POST /api/resumes (multipart/form-data)
    API->>AI: Extract structured profile & skills
    API->>DB: Save Resume + ResumeParseAudit
    API-->>SPA: Parsed resume + normalized skills

    Candidate->>SPA: Explore Jobs / Role-Fit Radar
    SPA->>API: GET /api/radar & POST /api/matches
    API->>DB: Load active jobs & user skill evidence
    API-->>SPA: Deterministic match score, gaps & priorities

    Candidate->>SPA: Launch targeted mock interview
    SPA->>API: POST /api/interviews & POST /api/interviews/:id/start
    API->>AI: Generate role & gap-focused plan + questions
    API->>DB: Persist Interview + InterviewQuestions

    loop For each question
        Candidate->>SPA: Submit answer
        SPA->>API: POST /api/interviews/:id/questions/:qId/answer
        API->>DB: Persist raw answer first (crash-safe)
        API->>AI: Score answer & check adaptive follow-up trigger
        API->>DB: Save feedback JSONB (+ optional follow-up question)
    end

    Candidate->>SPA: Complete & view evaluation report
    SPA->>API: POST /api/interviews/:id/evaluation
    API->>AI: Generate 6-dimension evaluation report
    API->>DB: Transactionally save Evaluation + UserSkill (STRONG/WEAK) + transcript
    API-->>SPA: Evaluation report (viewable & exportable to Markdown)
```

![Role Match Breakdown](./images/match-breakdown.png)

## Key Design Patterns

- **Closed-Loop Skill Evidence:** Resume claims start as unverified (`RESUME_EXTRACTED`); interview evaluations and proof submissions transactionally write `STRONG` or `WEAK` rows into `user_skills`, which directly influence readiness scores, match confidence, and Role-Fit Radar recommendations.
- **Deterministic Skill Ontology (`server/src/services/matching/skillDictionary.ts`):** Canonical skills, aliases, families, and prerequisites are resolved deterministically before matching or gap calculation. Unrecognized tokens are queued for admin review and persisted in `ontology_aliases`.
- **Fail-Safe Interview Answer Persistence:** `submitAnswerService` writes the candidate's raw answer before invoking AI scoring. If AI evaluation fails (`503 EVALUATION_PENDING`), the answer is preserved and retryable; once scored, the question is locked (`409 ALREADY_ANSWERED`).
- **Defense-in-Depth Rendering & Auth:** Untrusted job posting HTML passes through an allowlist sanitizer (`client/src/lib/sanitize.ts`) and external links require `http:`/`https:`. Access and refresh JWTs carry distinct `tokenType` claims, refresh tokens are stored hashed with constant-time comparison and rotated/revoked on logout, and React routes are wrapped in a global `ErrorBoundary` with `React.lazy` code splitting.
