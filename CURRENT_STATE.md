# CURRENT_STATE.md — TrueHire / Career_Lens

> **Last updated:** 2026-11-14 | **Status:** Feature-complete for the current scope; production deployment is on hold pending database migrations and auth/monitoring hardening.
> **Scope:** Repository configuration, backend/frontend source, Prisma schema and migrations, CI/CD workflows, and the reported 27-point pre-deployment checklist. Checklist claims were compared with the current working tree; external account actions cannot be independently verified here.

## Latest Checklist Verification

The submitted report marks all 27 items resolved. The repository confirms substantial progress: provider routing and provider clients exist, CORS is restricted to configured origins, application debug logs are gone, schema and route changes are present, skill coverage is larger, and CI/CD, unit tests, Playwright tests, job-sync code, and seed code have been added.

The following are **not verified as fully resolved** from the checked-in code:

| Area | Current evidence | Assessment |
|---|---|---|
| Secret rotation/history rewrite | Root `.env` and `server/.env` still exist locally, but are ignored and not tracked in the current Git index. Whether provider credentials were rotated or old objects were purged from every remote clone cannot be confirmed from source. | Treat rotation as an external operational action; verify in provider consoles and coordinate the rewritten Git history with collaborators. |
| Prisma deployment migration | The schema contains `JobSource`, `User.refreshTokenHash`, and JSON question feedback, and removes three old fields. The six checked-in migrations contain no corresponding migration for those changes; the original migration still declares job source and question feedback as `TEXT`. | **Deployment blocker:** create and review a migration against a copy of the production schema before running `prisma migrate deploy`. |
| Refresh-token security | Access and refresh tokens are both stored in browser `localStorage`; `verifyToken()` does not reject refresh-token payloads; hash persistence errors are swallowed, and a missing stored hash is accepted during refresh. | **Security blocker:** harden token type/session checks, fail visibly if persistence fails, and consider secure HttpOnly cookie storage. |
| Production env validation | `DATABASE_URL` and `JWT_SECRET` have development defaults and AI keys are optional in the schema. `render.yaml` declares secrets as dashboard-provided values, but does not make the application reject unsafe defaults in production. | Require production-only critical settings and test startup with missing/placeholder values. |
| Sentry | Initialization scaffolding exists, but neither `@sentry/node` nor `@sentry/react` is in the package manifests. Server exception capture is not wired into the central error handler; client import failure is silent. | Monitoring is not currently operational; install/configure SDKs and verify captured events. |
| Scheduled ATS sync | An in-process timer starts on each server instance; sync failures from individual ATS boards are discarded by `Promise.allSettled`. The GitHub CD workflow has no schedule trigger. | Best-effort sync, not a durable scheduler; use a single scheduled job/lock and surface partial failures. |

### Verification Run

Checked locally on 2026-11-14: backend `npm test` passed (10 files / 77 tests), backend TypeScript build passed, `prisma validate` passed, frontend Vitest passed (1 file / 4 tests), frontend production build passed, and Playwright passed (2 tests). The frontend build emits a >500 kB chunk warning. The Playwright tests mock API responses, so they are UI smoke tests rather than full backend/database/AI end-to-end tests. These results validate the current checkout, not production credentials or database migration state.

---

## 1. Project Overview & Tech Stack

### Application Architecture

TrueHire is a full-stack, AI-powered job discovery and interview-readiness platform built as a **monorepo** with two workspaces: `client/` (React 18 SPA) and `server/` (Express 4 REST API). The platform implements a traceable closed-loop workflow:

```text
Resume Upload → Deterministic Job Matching → Skill Gap Prioritization → User-Scoped Mock Interview → Rubric Evaluation → UserSkill Evidence Write-Back → Improved Role Matching
```

### Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite 5 | SPA (client/), production bundle verified via `tsc && vite build` |
| **Design System** | Tailwind CSS 3.4 + lucide-react | Single light theme (#f6f8fb canvas, #ffffff surface, #2563eb primary); 26 shared primitives in `client/src/components/ui/Primitives.tsx` |
| **Layout System** | AppShell, Sidebar, TopNav, MobileNav, PageHeader, ContentContainer | Unified responsive workspace, auth, and minimal shells in `client/src/components/layout/` |
| **Routing** | React Router DOM 6.22 | 18 client routes defined in `client/src/App.tsx` |
| **State / Data** | TanStack React Query 5 + React Context | Query cache + AuthContext + central apiClient wrapper |
| **Backend** | Node.js 20 + Express 4.18 + TypeScript 5.3 | Layered architecture: routes → controllers → services → repositories → Prisma |
| **ORM & Database** | Prisma 5.10 + PostgreSQL 15 | Supabase (pgBouncer `DATABASE_URL` + `DIRECT_URL`) in prod; Docker locally (port 5433) |
| **Auth** | JWT (jsonwebtoken 9) + bcryptjs | Access + rotating refresh JWTs; both currently stored in browser `localStorage` |
| **File Upload & Parsing** | Multer 2 (memory storage, 5 MB limit) + pdf-parse 2 + mammoth 1.12 | In-memory PDF and DOCX text extraction (≥40 chars required) |
| **AI / LLM** | OpenAI-compatible SDK (openai v7) | Provider selection for Groq, NVIDIA NIM, Gemini, or Ollama; Groq additionally supports task tiers and a fast-model fallback |
| **Validation & Security** | Zod 3, Helmet 7, strict CORS, express-rate-limit 7 | 4 rate-limit tiers (globalRateLimiter, authLimiter, uploadLimiter, aiLimiter) |
| **Testing** | Vitest, Supertest, Playwright | Backend: 10 suites / 77 tests; frontend unit: 4 tests; Playwright: 2 mocked UI smoke tests |
| **CI/CD** | GitHub Actions | CI verifies server/client; CD verifies then triggers optional Render/Vercel deploy hooks |
| **Monitoring** | Sentry initialization scaffolding | SDK dependencies are absent from package manifests; not yet verified operational |
| **Deployment Configs** | `render.yaml` (Backend) + `client/vercel.json` (Frontend SPA) | Deployment configuration exists; production migrations and environment settings still need verification |

### Environment & Deployment Configuration

| Variable / file | Current role | Deployment note |
|---|---|---|
| `.env`, `server/.env` | Local-only root/server environment files | Present on disk, ignored by `.gitignore`, and not tracked in the current Git index. Do not copy their values into source, logs, or documentation. |
| `.env.example`, `server/.env.example`, `client/.env.example` | Environment templates | Review/update when config changes; templates must contain placeholders only. |
| `DATABASE_URL`, `DIRECT_URL` | Runtime pooled DB connection and migration/direct connection | Render marks these as dashboard-provided. Ensure both are set; `DIRECT_URL` is used by migrations. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Access JWT signing and lifetime | `render.yaml` requests generated secret and `7d` lifetime. The application schema still has a development fallback; production should fail closed if unset. |
| `AI_PROVIDER`, provider API keys/base URLs/models | Provider routing: Groq, NVIDIA, Gemini, or Ollama | Render selects Groq and accepts `AI_API_KEY`; each provider also has provider-specific settings (for example `NVIDIA_API_KEY`, `NVIDIA_BASE_URL`, `NVIDIA_MODEL`). Keep provider, endpoint, credential, and model aligned when switching. |
| `VITE_API_BASE_URL` | API URL embedded in the built client | Must be configured in Vercel's build environment; `client/vercel.json` only handles SPA rewrites. |
| `CLIENT_URL` | Backend CORS allowlist (comma-separated origins) | Must exactly match deployed frontend origin(s); wildcard should not be used in production. |
| `JWT_REFRESH_EXPIRES_IN` | Refresh JWT lifetime | Read directly from `process.env`; it is not part of the validated environment schema. Add validation and test invalid/missing values before relying on it in production. |
| `SENTRY_DSN`, `VITE_SENTRY_DSN` | Intended error-monitoring configuration | Current initialization code references these, but the SDK dependencies are missing; setting the DSNs alone does not activate monitoring. |

### Repository Directory Tree

```
Career_Lens/
├── .gitattributes
├── .gitignore
├── CURRENT_STATE.md
├── docker-compose.yml
├── README.md
├── render.yaml
├── docs/
│   ├── AI_MODELS.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── ENVIRONMENT.md
│   └── UI_SCREENSHOT_WORKFLOW.md
├── client/
│   ├── .env.example
│   ├── capture-ui.mjs
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vercel.json
│   ├── vite.config.ts
│   ├── public/landing/
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       ├── components/
│       │   ├── NavBar.tsx
│       │   ├── layout/           ← AppShell, Sidebar, TopNav, MobileNav, PageHeader, ContentContainer, navigation
│       │   └── ui/               ← Primitives.tsx (26 shared components), AceternityPrimitives.tsx, index.ts
│       ├── features/
│       │   ├── auth/             ← AuthContext, LoginForm, RegisterForm, OnboardingWizard,
│       │   │                        ProfileSetupForm, ProtectedRoute, UserProfileCard, useAuth, index.ts
│       │   ├── dashboard/        ← DashboardPage.tsx
│       │   ├── interview/        ← interviewApi.ts, InterviewsPage.tsx, InterviewPreparationPage.tsx,
│       │   │                        LiveInterviewPage.tsx, InterviewEvaluationPage.tsx, types.ts
│       │   ├── jobs/             ← jobsApi.ts, JobsPage.tsx, SavedJobsPage.tsx, JobCard.tsx, types.ts
│       │   ├── landing/          ← LandingPage.tsx
│       │   ├── matching/         ← matchingApi.ts, MatchPage.tsx, MatchResult.tsx, SkillGapPage.tsx,
│       │   │                        skillResources.ts, types.ts
│       │   ├── readiness/        ← readinessApi.ts, ReadinessPage.tsx, ReadinessPanel.tsx, useReadiness.ts
│       │   ├── resume/           ← resumeApi.ts, ResumePage.tsx, ResumeUploader.tsx,
│       │   │                        ResumeParsedPreview.tsx, resumeFile.ts, useResumes.ts, types.ts
│       │   ├── tailoring/        ← tailoringApi.ts, TailoringPage.tsx
│       │   └── tracker/          ← trackerApi.ts, TrackerPage.tsx, useApplications.ts, types.ts
│       ├── lib/
│       │   └── api-client.ts
│       ├── services/
│       │   └── authApi.ts
│       └── types/
│           └── auth.ts
└── server/
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/           ← 6 migrations
    └── src/
        ├── app.ts
        ├── index.ts
        ├── config/               ← db.ts, env.ts
        ├── controllers/          ← 7 controllers (application, auth, interview, job, match, readiness, resume)
        ├── integrations/
        │   ├── ai/               ← Provider router + Groq, NVIDIA, Gemini, Ollama clients, prompts/schemas
        │   └── jobs/             ← Greenhouse, Lever, and Ashby clients/adapters/schemas
        ├── middleware/           ← authMiddleware.ts, rateLimit.ts, requireRole.ts, uploadMiddleware.ts
        ├── modules/
        │   ├── evaluation/       ← finalEvaluationSchema.ts, interview.evaluation.prompt.ts
        │   └── interview/        ← interview.ai.ts, interview.prompt.ts, interview.question.prompt.ts, interviewSchema.ts
        ├── repositories/         ← 8 repositories (application, interview, job, match, resume, savedJob, skill, user)
        ├── routes/               ← 7 route modules (application, auth, interview, job, match, readiness, resume)
        ├── scripts/              ← verifyAi.ts (manual AI connectivity test)
        ├── services/             ← authService, applicationService, interviewService, jobSyncScheduler,
        │                            greenhouseSyncService, jobService, savedJobService, matching/, readiness/,
        │                            resume/, skills/, tailoring/
        ├── utils/                ← appError.ts, documentParser.ts, jobQuery.ts, jwt.ts, parseModelJson.ts, password.ts
        ├── validators/           ← authValidator.ts, resumeValidator.ts
        └── __tests__/            ← 10 Vitest test files + fixtures/
├── .github/workflows/            ← ci.yml and cd.yml
└── client/src/__tests__/         ← Vitest API-client test and Playwright UI smoke tests
```

---

## 2. Feature & Subsystem Status Matrix

| Subsystem | Implemented? | Key Files (Backend & Frontend) | How It Currently Works | Current Limitations / Edge Cases |
|---|---|---|---|---|
| **Auth, Onboarding & User Profile** | ⚠️ Access + refresh flow implemented; security hardening remains | BE: `routes/auth.ts`, `controllers/authController.ts`, `services/authService.ts`, `utils/jwt.ts`, `repositories/userRepository.ts` FE: `AuthContext.tsx`, `services/authApi.ts`, `lib/api-client.ts` | Register/login issue an access JWT and refresh JWT. `POST /api/auth/refresh` verifies and rotates refresh tokens; `POST /api/auth/logout` clears the stored hash. The client automatically attempts one refresh and retries a 401 request. | Both tokens are stored in `localStorage`. `verifyToken()` currently accepts a refresh JWT as an access JWT because it does not reject the `tokenType` claim. Refresh-token hash persistence errors are swallowed, and refresh is allowed when no hash is stored; migration/schema deployment is therefore essential. Password change has no UI; email changes have no verification. |
| **Resume Upload & Parsing** | ✅ Fully wired E2E | BE: `routes/resumeRoutes.ts`, `controllers/resumeController.ts`, `services/resume/resumeService.ts`, `utils/documentParser.ts`, AI prompts/schemas, `repositories/resumeRepository.ts`, `middleware/uploadMiddleware.ts` FE: `features/resume/` | Multer (memory storage, 5 MB limit, PDF/DOCX) extracts text via `pdf-parse` or `mammoth`, requires at least 40 readable characters, calls the selected AI provider, validates the response with Zod, and stores text/analysis/skills. | Uploaded files are not persisted; the `filePath` field was removed from the Prisma model, but no matching schema migration is present. Scanned PDFs have no OCR fallback. Resume data includes raw text and parsed personal information, so database access/retention deserves special care. |
| **Skill Extraction & Normalization** | ✅ Deterministic; dictionary expanded | BE: `services/matching/skillDictionary.ts`, `skillNormalizer.ts`, `jobSkillExtractor.ts`, resume service | `SKILL_DICTIONARY` has 128 canonical entries; aliases use whole-word patterns, and unknown resume skills retain their cleaned lowercase text for exact matching. The same dictionary powers job extraction, matching, tailoring, and interview evidence. | No fuzzy matching or taxonomy/versioning. Aliases can still be ambiguous (especially short abbreviations); review false positives before treating scores as authoritative. `Resume.skills` stores AI-extracted names; canonicalization occurs at matching time. |
| **Job Sync & Exploration (Greenhouse / Lever / Ashby)** | ⚠️ Adapters and sync orchestration implemented; operational reliability unverified | BE: `integrations/jobs/{greenhouse,lever,ashby}/`, `services/greenhouseSyncService.ts`, `services/jobSyncScheduler.ts`, `routes/jobRoutes.ts` FE: `features/jobs/` | Public board endpoints are schema-validated and adapted to canonical jobs; sync filters software roles, upserts live jobs, and also inserts curated listings. Admin-only `/api/jobs/sync` and `/api/jobs/sync/greenhouse` routes are present. | The in-process timer runs once per web process and has no distributed lock; individual board errors are discarded by `Promise.allSettled`, and scheduled sync does not deactivate stale postings from all sources. Curated records include salary/job details that should be verified before being presented as live vacancies. No proven external scheduler or sync alerting. |
| **Job Match Scoring Engine** | ✅ Fully deterministic, E2E wired | BE: `routes/matchRoutes.ts`, `controllers/matchController.ts`, `services/matching/matchService.ts`, `services/matching/matchingService.ts`, `repositories/matchRepository.ts` FE: `features/matching/matchingApi.ts`, `MatchPage.tsx`, `MatchResult.tsx` | `calculateMatch()` normalizes requirements and candidate skills, applies `UserSkill` STRONG/WEAK evidence, and scores the matched fraction. The tactical matrix records verified strengths, unverified claims, and exposed weaknesses. Results upsert an `Application`. Only canonical `POST /api/matches` is mounted. | Unrecognized job requirements can still lead to `INSUFFICIENT_DATA`; dictionary expansion helps but does not solve taxonomy coverage. The matching tactical matrix uses 0.5 weight for unverified skills, while readiness uses 0.4, so defensibility views can differ. |
| **Skill Gap Analysis** | ✅ Fully wired E2E | BE: same as match scoring (embedded in match response) FE: `features/matching/SkillGapPage.tsx`, `features/matching/skillResources.ts` | Skill gaps are the `missingSkills` from `calculateMatch()`, ranked by mention frequency in the job description: 3+ mentions = high, 2 = medium, 1 or less = low. If a skill was flagged WEAK in a previous interview it gets priority "high" with a specific evidence string. Stored as `skillGaps: String[]` on the `Application` record. | Only dictionary-known skills appear in gaps. No LLM-generated remediation suggestions. `skillResources.ts` appears to map skill names to learning resources (static data). |
| **Resume Tailoring Workbench** | ✅ Fully wired E2E (deterministic, no LLM) | BE: `routes/resumeRoutes.ts`, `services/tailoring/tailoringService.ts` FE: `features/tailoring/` | Deterministically suggests adding skills only when the resume text supports them; lists unsupported skills as gaps. Suggestions are returned to the UI and no longer rely on the removed `Application.tailoredText` column. | No AI rewriting or persistence of edited resume content. A skill mention is evidence of text presence, not proof of proficiency; users should review suggestions before editing a resume. |
| **Mock Interview Generation & Live Flow** | ✅ Plan/question/evaluation flow wired | BE: `routes/interviewRoutes.ts`, `controllers/interviewController.ts`, `services/interviewService.ts`, `modules/interview/`, `repositories/interviewRepository.ts` FE: `features/interview/` | Supports custom deterministic plans or AI-generated plans; questions and evaluations use the selected AI provider. Answers are saved before AI evaluation, enabling retry after a transient evaluation failure. Question feedback is stored as structured JSON, and the client supports legacy string feedback. | Still requires an application and resume. No adaptive follow-ups. Per-question evaluation uses the interview title rather than full job description. No transcript column is retained. The final evaluation service still includes a compatibility typo correction for model output. |
| **Interview Evaluation & Profile Write-Back** | ✅ E2E flow present; production schema migration pending | BE: `services/interviewService.ts`, `repositories/skillRepository.ts`, `services/skills/skillEvidence.ts` FE: `features/interview/InterviewEvaluationPage.tsx` | Final report requires a completed interview; validates AI output; transactionally saves the report and upserts `UserSkill` evidence. The UI invalidates readiness/application caches after loading/generating a report. | Evaluation evidence is limited to dictionary matches. The evaluation JSON model combines sub-scores and narrative fields. Current migration history does not include all schema edits required by the application. |
| **Saved Jobs & Application Tracker** | ✅ Fully wired | BE: job/application controllers, services, repositories; FE: `features/jobs/`, `features/tracker/` | Saved jobs and applications are user-scoped; repeated save/apply/match operations use upserts where appropriate. Status updates validate against `ApplicationStatus`; delete application endpoint exists. Debug request-body logging reported previously is absent from the current `applicationController.ts`. | Saved jobs and applications remain separate records. No bulk updates or archive state. |
| **UI Design System & Layout Shell** | ✅ Stable | FE: `components/layout/AppShell.tsx`, `Sidebar.tsx`, `TopNav.tsx`, `MobileNav.tsx`, `PageHeader.tsx`, `ContentContainer.tsx`, `components/ui/Primitives.tsx`, `components/ui/AceternityPrimitives.tsx` | `AppShell` supports 3 variants: `auth` (centered card), `minimal` (no nav), `workspace` (full sidebar + topnav). `Sidebar` renders navigation defined in `components/layout/navigation.ts`. `Primitives.tsx` exports reusable `Button`, `Card`, `Badge`, etc. `AceternityPrimitives.tsx` exports motion-enhanced components (Framer Motion). | Current design is light-themed; there is no theme toggle or Storybook/component catalog. `NavBar.tsx` exists at the root of `components/` and appears legacy/unused (layout uses `Sidebar` + `TopNav`). |
| **Testing, CI/CD & Monitoring** | ✅ Builds/tests/workflows exist; deployment confidence is partial | Backend: 10 Vitest suites; client: Vitest + Playwright; `.github/workflows/ci.yml`, `cd.yml`; Sentry init modules | Local verification passed: server 77/77 tests and TypeScript build; Prisma schema validation; client 4/4 unit tests, 2/2 Playwright tests, and production build. CI verifies unit tests and builds; CD verifies then triggers optional deploy hooks. | Playwright specs mock API calls and do not verify a live backend or database. CI does not run Playwright. Vite warns about a 546.79 kB minified JS chunk. Sentry SDK packages are absent from dependency manifests and exception capture is not wired, so monitoring should be considered inactive. |

---

## 3. Database Schema & Data Model

**Provider:** PostgreSQL 15 via Prisma 5.10. Connection pooled via pgBouncer (Supabase). `DIRECT_URL` used for migrations.

### Enums

| Enum | Values |
|---|---|
| `Role` | `USER`, `ADMIN` |
| `JobSource` | `GREENHOUSE`, `LEVER`, `ASHBY`, `MANUAL`, `LINKEDIN` |
| `ApplicationStatus` | `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, `REJECTED` |
| `InterviewStatus` | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `SkillStatus` | `STRONG`, `WEAK` |

### Models

#### `User` → table `users`
| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `email` | `String @unique` | |
| `passwordHash` | `String` | bcrypt, never returned to client |
| `refreshTokenHash` | `String?` | SHA-256 hash used for refresh-token rotation; current persistence/error handling needs hardening |
| `name` | `String` | |
| `role` | `Role @default(USER)` | |
| `targetRole` | `String?` | Set during onboarding |
| `preferredLocations` | `String[] @default([])` | Array of location strings |
| `experienceLevel` | `String?` | Free text (e.g., "junior", "senior") |
| `createdAt`, `updatedAt` | `DateTime` | Auto-managed |
| **Relations** | `resumes[]`, `savedJobs[]`, `applications[]`, `interviews[]`, `userSkills[]` | All cascade-delete on user delete |

#### `Resume` → table `resumes`
| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `userId` | `String` FK → `users.id` (cascade) | |
| `title` | `String` | Set to `file.originalname` (truncated at 255 chars) |
| `fileName` | `String?` | Original filename |
| `mimeType` | `String?` | PDF or DOCX mime type |
| `fileSize` | `Int?` | Bytes |
| `rawText` | `String @db.Text` | Full extracted text |
| `parsedData` | `Json?` | Full LLM analysis (summary, education, experience, projects) |
| `skills` | `String[] @default([])` | Extracted skill names (raw, pre-normalization) |
| `experienceYrs` | `Int @default(0)` | Clamped 0-60 |
| `createdAt`, `updatedAt` | `DateTime` | |
| **Index** | `@@index([userId, createdAt(sort: Desc)])` | For efficient newest-first fetch |

#### `Job` → table `jobs`
| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `externalId` | `String? @unique` | Greenhouse numeric ID as string, or `ext-{source}-{timestamp}` for imports |
| `source` | `JobSource` | Enum: Greenhouse, Lever, Ashby, manual, or LinkedIn |
| `title` | `String` | |
| `company` | `String` | |
| `location` | `String?` | |
| `description` | `String @db.Text` | HTML-stripped job content |
| `requirements` | `String[]` | Extracted canonical skill names |
| `salaryRange` | `String?` | Always null for Greenhouse jobs |
| `url` | `String?` | Application URL |
| `isActive` | `Boolean @default(true)` | Set false when not in latest sync |
| `lastSyncedAt` | `DateTime @default(now())` | Updated on upsert |
| `createdAt`, `updatedAt` | `DateTime` | |
| **Indexes** | `@@index([isActive, source])`, `@@index([company])` | |

#### `SavedJob` → table `saved_jobs`
| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `userId` | `String` FK → `users.id` (cascade) | |
| `jobId` | `String` FK → `jobs.id` (cascade) | |
| `createdAt` | `DateTime @default(now())` | |
| **Unique** | `@@unique([userId, jobId])` | Prevents duplicate saves |

#### `Application` → table `applications`
| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `userId` | `String` FK → `users.id` (cascade) | |
| `jobId` | `String` FK → `jobs.id` (cascade) | |
| `status` | `ApplicationStatus @default(SAVED)` | |
| `matchScore` | `Float?` | Set by `upsertApplicationMatch()` after scoring |
| `skillGaps` | `String[]` | Gap skill names from match engine |
| `createdAt`, `updatedAt` | `DateTime` | |
| **Unique** | `@@unique([userId, jobId])` | One application per user per job |
| **Relations** | `interviews[]` | Optional link; SetNull on application delete |

#### `Interview` → table `interviews`
| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `userId` | `String` FK → `users.id` (cascade) | |
| `applicationId` | `String?` FK → `applications.id` (SetNull) | |
| `title` | `String` | "{jobTitle} at {company}" |
| `status` | `InterviewStatus @default(SCHEDULED)` | |
| `plan` | `Json?` | LLM-generated or deterministic plan object |
| `createdAt`, `updatedAt` | `DateTime` | |
| **Relations** | `questions[]`, `evaluation?` | |

#### `InterviewQuestion` → table `interview_questions`
| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `interviewId` | `String` FK → `interviews.id` (cascade) | |
| `round` | `String` | Round name from plan (e.g., "Technical Deep Dive") |
| `question` | `String @db.Text` | LLM-generated question text |
| `order` | `Int` | Sequential, starts at 1 |
| `answer` | `String? @db.Text` | Candidate's answer |
| `feedback` | `Json?` | Structured per-question LLM evaluation |
| `score` | `Float?` | Per-question score (0-100) |
| `createdAt`, `updatedAt` | `DateTime` | |
| **Unique** | `@@unique([interviewId, order])` | Enforces ordering |

#### `Evaluation` → table `evaluations`
| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `interviewId` | `String @unique` FK → `interviews.id` (cascade) | One per interview |
| `score` | `Float` | Overall interview score |
| `feedback` | `String @db.Text` | LLM-generated summary feedback |
| `breakdown` | `Json` | `{communication, technical, problem_solving, strengths[], improvements[], recommendation}` |
| `createdAt` | `DateTime` | |

#### `UserSkill` → table `user_skills`
| Field | Type | Notes |
|---|---|---|
| `id` | `String @id` | |
| `userId` | `String` FK → `users.id` (cascade) | |
| `skill` | `String` | Canonical skill name from dictionary |
| `status` | `SkillStatus` | `STRONG` or `WEAK` |
| `evidence` | `String` | Human-readable source (e.g., "Named under strengths in a mock interview report") |
| `updatedAt` | `DateTime @updatedAt` | |
| **Unique** | `@@unique([userId, skill])` | Upsert-safe |
| **Index** | `@@index([userId, status])` | For fast filtering |

### Entity Relationship Summary

```
User ──< Resume          (1:many)
User ──< SavedJob >── Job
User ──< Application >── Job
Application ──< Interview ──< InterviewQuestion
                Interview ──  Evaluation (1:1)
User ──< UserSkill
```

Skills flow:
- **Resume.skills[]** → raw LLM-extracted strings
- **Job.requirements[]** → dictionary-canonicalized strings from Greenhouse description
- **UserSkill.skill** → dictionary canonical names, written by `saveEvaluationWithSkillEvidence()`
- **Application.skillGaps[]** → canonical gap names from `calculateMatch()`

### Migration Status

The Prisma schema is valid and `prisma validate` passes, but the migration history currently contains six migrations and does not include the reported schema changes: `JobSource`, `User.refreshTokenHash`, `InterviewQuestion.feedback` changing from `TEXT` to `JSONB`, or removal of `Resume.filePath`, `Application.tailoredText`, and `Interview.transcript`. The initial SQL still uses a text job source and interview feedback. `render.yaml` runs `prisma migrate deploy`, which applies checked-in migrations only; it does not reconcile the live database to `schema.prisma`. Generate/review a forward migration (including safe data conversion/backfill) before deploying.

---

## 4. Backend API & Service Architecture

All endpoints under `/api/`. Global rate limit: 300 req / 15 min. Auth via `Authorization: Bearer <token>` header.

### Auth Domain — `/api/auth`

| Method | Path | Handler | Logic Type | Request → Response Summary |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | `authController.register` → `authService.register` | Deterministic (DB + bcrypt) | `{email, password, name}` → `{user, token, refreshToken}`. Rate-limited (10/15min). Duplicate email → 409. |
| `POST` | `/api/auth/login` | `authController.login` → `authService.login` | Deterministic (DB + bcrypt) | `{email, password}` → `{user, token, refreshToken}`. Rate-limited. Wrong creds → 401. |
| `POST` | `/api/auth/refresh` | `authController.refresh` → `authService.refreshSession` | JWT + DB hash rotation | Body: `{refreshToken}`. Returns new access and refresh tokens. Rate-limited. |
| `POST` | `/api/auth/logout` | `authController.logout` → `authService.logout` | DB mutation | Requires access token; clears the stored refresh-token hash. |
| `GET` | `/api/auth/me` | `authController.getMe` → `authService.getProfile` | DB query | Requires auth. Returns sanitized user (no `passwordHash`). |
| `PUT` | `/api/auth/profile` | `authController.updateProfile` → `authService.updateProfile` | DB mutation | Requires auth. Partial updates: name, email, password, targetRole, preferredLocations, experienceLevel. Duplicate email → 409. |

### Resume Domain — `/api/resumes`

| Method | Path | Handler | Logic Type | Request → Response Summary |
|---|---|---|---|---|
| `POST` | `/api/resumes` | `resumeController.createResume` → `resumeService.createResumeService` | LLM (AI analysis) + DB | Multipart `resume` file (PDF/DOCX, ≤5MB). Extracts text → LLM analysis (up to 2 retries) → Zod validation → DB insert. Returns `{success, resume}`. Rate-limited (30/15min). |
| `GET` | `/api/resumes` | `resumeController.getUserResumeController` | DB query | Requires auth. Returns `{success, resumes[]}` newest-first. |
| `GET` | `/api/resumes/:id` | `resumeController.getUserResumeByIdController` | DB query | User-scoped (can't access other users' resumes). 404 if not found. |
| `DELETE` | `/api/resumes/:id` | `resumeController.deleteResumeController` | DB mutation | User-scoped delete. Returns `{success, message}`. |
| `POST` | `/api/resumes/:id/tailoring` | `resumeController.tailorResumeController` → `tailoringService.tailorResumeService` | Deterministic (no LLM) | Body: `{jobId}`. Returns `{success, data: TailoringSuggestions}`. |

### Job Domain — `/api/jobs`

| Method | Path | Handler | Logic Type | Request → Response Summary |
|---|---|---|---|---|
| `GET` | `/api/jobs` | `jobController.getJobsController` | DB query | Query params: `q`, `location`, `source`, `page`, `pageSize` (max 100, default 50). Returns `{jobs[], total, page, pageSize}`. |
| `GET` | `/api/jobs/:id` | `jobController.getJobByIdController` | DB query | Returns `{success, job}`. 404 if not found. |
| `POST` | `/api/jobs/sync` | `jobController.syncGreenhouseController` | External ATS APIs + DB | Requires `ADMIN`. Optional `{boardToken?, company?}` selects a Greenhouse board; otherwise triggers all-source software job sync. |
| `POST` | `/api/jobs/sync/greenhouse` | `jobController.syncGreenhouseController` | External ATS APIs + DB | Requires `ADMIN`. Same handler as `/sync`; redundant route alias remains. |
| `POST` | `/api/jobs/external` | `jobController.importExternalJobController` | Deterministic (skill extraction) + DB | Body: `{title, company, description, location?, source?, url?, salaryRange?}`. Extracts skills from description via dictionary. Returns `{success, job}`. |
| `GET` | `/api/jobs/saved` | `jobController.getSavedJobsController` | DB query | Returns `{success, jobs[]}` with job details. |
| `POST` | `/api/jobs/:id/save` | `jobController.saveJobController` | DB mutation | Creates `SavedJob` row. 404 if job not found or inactive. 409 if already saved (Prisma unique constraint). |
| `DELETE` | `/api/jobs/:id/save` | `jobController.unsaveJobController` | DB mutation | Removes `SavedJob` row. |

### Match Domain — `/api/matches`

| Method | Path | Handler | Logic Type | Request → Response Summary |
|---|---|---|---|---|
| `POST` | `/api/matches` | `matchController.matchResumeToJobController` → `matchService.matchResumeToJob` | Deterministic (no LLM) | Body: `{resumeId, jobId}`. Fetches resume skills + job requirements + user's `UserSkill` records. Returns `{success, data: {score, matchedSkills[], missingSkills[], skillGaps[], applicationId, tactical}}`. Upserts `Application` row. `/api/match` alias removed. |

### Interview Domain — `/api/interviews`

| Method | Path | Handler | Logic Type | Request → Response Summary |
|---|---|---|---|---|
| `GET` | `/api/interviews` | `interviewController.listUserInterviewsController` | DB query | Returns `{success, data: Interview[]}`. |
| `POST` | `/api/interviews` | `interviewController.createInterviewController` → `interviewService.createInterviewService` | LLM (plan + questions) or Deterministic (plan only) + DB | Body: `{applicationId, durationMinutes?, difficulty?, focusTopics?}`. Custom config → deterministic plan + LLM questions. No config → LLM plan + LLM questions. Rate-limited (20/min AI). |
| `GET` | `/api/interviews/:interviewId` | `interviewController.getInterviewSessionByIdController` | DB query | Returns full interview with questions. |
| `POST` | `/api/interviews/:interviewId/start` | `interviewController.startInterviewController` | DB mutation | Sets status `IN_PROGRESS`. Returns `{interview, firstQuestion}`. 400 if already started/completed. |
| `POST` | `/api/interviews/:interviewId/questions/:questionId/answer` | `interviewController.submitAnswerController` → `interviewService.submitAnswerService` | LLM (per-question eval) + DB | Body: `{answer}`. Enforces sequential order. LLM evaluates answer (score, feedback, strengths, improvements). Saves to `InterviewQuestion`. Marks `COMPLETED` when all done. Rate-limited. |
| `POST` | `/api/interviews/:interviewId/evaluation` | `interviewController.generateFinalEvaluationController` → `interviewService.generateFinalEvaluationService` | LLM (final eval) + DB transaction | Requires `COMPLETED` status. Idempotent (409 if exists). LLM generates overall evaluation. Atomically saves `Evaluation` + upserts `UserSkill[]`. Rate-limited. |

### Application Domain — `/api/applications`

| Method | Path | Handler | Logic Type | Request → Response Summary |
|---|---|---|---|---|
| `GET` | `/api/applications` | `applicationController.getApplicationsController` | DB query | Returns `{success, applications[]}` with job info. |
| `GET` | `/api/applications/:id` | `applicationController.getApplicationByIdController` | DB query | User-scoped. 404 if not found. |
| `POST` | `/api/applications/job/:jobId` | `applicationController.createApplicationController` | DB mutation | Creates application for authenticated user. 404 if job not found. |
| `PATCH` | `/api/applications/:id/status` | `applicationController.updateApplicationStatusController` | DB mutation | Body: `{status: ApplicationStatus}`. Validates against enum. Previously reported request-body debug logs are absent in the current implementation. |

### Readiness Domain — `/api/readiness`

| Method | Path | Handler | Logic Type | Request → Response Summary |
|---|---|---|---|---|
| `GET` | `/api/readiness` | `readinessController.getReadinessController` → `readinessService.getReadinessService` | Deterministic (DB aggregation) | Returns `{success, data: {skills[], nextAction, defenseSummary, offenseTargets[]}}`. Aggregates `UserSkill`, resumes, and applications. `decideNextAction()` is a priority-ordered rule engine. Defensibility score = (fortified×1 + unverified×0.4) / total skills × 100. |

### Health Check

| Method | Path | Handler | Notes |
|---|---|---|---|
| `GET` | `/api/health` | Inline in `app.ts` | Runs `SELECT 1` on DB. Returns status, timestamp, env, and `aiConfigured` boolean. `aiConfigured` only reflects key presence, not provider connectivity. |

---

## 5. Frontend Routes & State Wiring

All routes defined in [`client/src/App.tsx`](client/src/App.tsx). Auth state managed by `AuthContext` (React Context + localStorage). API calls via `apiClient` in `lib/api-client.ts` (fetch wrapper with auto-token injection).

| Route | Component File | API Endpoints Called | Mock/Fallback State? |
|---|---|---|---|
| `/` | `features/landing/LandingPage.tsx` | None | Static landing page |
| `/login` | `LoginPage` (inline in App.tsx) → `features/auth/LoginForm.tsx` | `POST /auth/login` | No. Error shown from API response. |
| `/register` | `RegisterPage` (inline) → `features/auth/RegisterForm.tsx` | `POST /auth/register` | No. Navigates to `/onboarding` on success. |
| `/onboarding` | `features/auth/OnboardingWizard.tsx` | `PUT /auth/profile` | No. Protected route, minimal shell. |
| `/dashboard` | `features/dashboard/DashboardPage.tsx` | Readiness, resumes, applications, and/or jobs via feature hooks | Dashboard uses live feature data; current Playwright smoke test mocks its API responses. |
| `/readiness` | `features/readiness/ReadinessPage.tsx` | `GET /readiness` | No. Uses `useReadiness` hook + React Query. |
| `/skills` | `features/readiness/ReadinessPage.tsx` | `GET /readiness` | Same component as `/readiness`. Alias route. |
| `/interviews` | `features/interview/InterviewsPage.tsx` | `GET /interviews` | No. Lists user's past interviews. |
| `/interviews/:interviewId/prep` | `features/interview/InterviewPreparationPage.tsx` | `GET /interviews/:id`, `POST /interviews` (create) | No |
| `/interviews/:interviewId/live` | `features/interview/LiveInterviewPage.tsx` | `POST /interviews/:id/start`, `POST /interviews/:id/questions/:qId/answer` | No |
| `/interviews/:interviewId/evaluation` | `features/interview/InterviewEvaluationPage.tsx` | `POST /interviews/:id/evaluation` | No |
| `/jobs` | `features/jobs/JobsPage.tsx` | `GET /jobs?pageSize=100`, `POST /jobs/:id/save`, `DELETE /jobs/:id/save` | No |
| `/saved-jobs` | `features/jobs/SavedJobsPage.tsx` | `GET /jobs/saved` | No |
| `/applications` | `features/tracker/TrackerPage.tsx` | `GET /applications`, `PATCH /applications/:id/status` | No |
| `/resume` | `features/resume/ResumePage.tsx` | `GET /resumes`, `POST /resumes` (upload), `DELETE /resumes/:id` | No |
| `/profile` | `features/auth/UserProfileCard.tsx` | `GET /auth/me` (via AuthContext) | No |
| `/profile-setup` | `features/auth/ProfileSetupForm.tsx` | `PUT /auth/profile` | No |
| `/matches/:jobId` | `features/matching/MatchPage.tsx` | `GET /jobs/:id`, `GET /resumes`, `POST /matches` | No |
| `/skill-gaps/:jobId` | `features/matching/SkillGapPage.tsx` | Reads match/readiness data | Canonical route; `/skill-gap/:jobId` alias removed. |
| `/tailor/:jobId` | `features/tailoring/TailoringPage.tsx` | `POST /resumes/:resumeId/tailoring` | No |
| `*` (404) | `NotFound` (inline in App.tsx) | None | Static 404 component |

**Token storage:** `localStorage['truehire_auth_token']` and `localStorage['truehire_refresh_token']`. On 401, the API client attempts one refresh and retries; if refresh fails it clears both tokens and dispatches `truehire:unauthorized`. Keeping refresh tokens in localStorage increases exposure to XSS.

**API base URL:** `VITE_API_BASE_URL` env var, defaults to `http://localhost:5000/api`. No proxy configured in Vite config.

---

## 6. Stable Foundation (What Is Working Well)

1. **Authentication flow** — Register/login, protected routes, profile updates, and refresh/logout endpoints exist. Refresh-token validation and persistence still need security fixes (see below).

2. **Resume upload pipeline** — Multer → pdf-parse/mammoth → LLM → Zod validation → PostgreSQL. Clear error messages for unsupported types, too-large files, and unparseable content. Up to 2 automatic retries on AI validation failure.

3. **Matching engine (fully deterministic)** — `calculateMatch()` and `calculateTacticalMatrix()` are well-tested, produce traceable numbers, and correctly incorporate interview evidence. Zero LLM dependency in the critical scoring path.

4. **Skill dictionary** — 128 canonical entries with whole-word regex matching, shared by extraction, normalization, scoring, tailoring, and skill evidence.

5. **Interview closed-loop** — The chain from interview answer evaluation → `skillEvidenceFromReport()` → `saveEvaluationWithSkillEvidence()` (atomic transaction) → `UserSkill` upsert → next `calculateMatch()` reflects evidence is fully wired E2E.

6. **Tailoring service** — Correctly identifies skills present in resume text but missing from the skills list (`addToSkills`) vs. skills genuinely absent (`notOnResume`). Fully deterministic, fast, and accurately prioritizes by job posting frequency.

7. **Readiness service** — `decideNextAction()` is a testable, priority-ordered rule engine. The aggregation also has a broad fallback catch that can hide database errors outside tests and should eventually be narrowed.

8. **Automated verification** — The current checkout passes backend tests (10 suites / 77 tests), backend build and Prisma validation, frontend unit tests (4 tests), Playwright (2 UI smoke tests), and frontend build.

9. **Error handling** — Centralized `AppError` class with HTTP status + error code. Global error handler in `app.ts` handles AppError, ZodError, Multer errors, and unhandled exceptions with consistent JSON shape `{success, code, message}`.

10. **Security layers** — Helmet headers, CORS, 4 rate-limit tiers (global, auth, upload, AI), JWT verification middleware, `requireRole()` for ADMIN-only endpoints, user-scoped repository queries preventing cross-user data access.

11. **ATS integration foundation** — Greenhouse, Lever, and Ashby adapters map public job-board responses to canonical records; sync reliability and listing freshness still need operational safeguards.

---

## 7. Technical Debt & Gaps Found in Code

### 🔴 Critical / Deployment Blockers

1. **Prisma migrations do not represent the current schema.** `schema.prisma` validates, but the migration history has no forward migration for the refresh-token hash, `JobSource`, JSON feedback, or removed columns. Render uses `prisma migrate deploy`; that applies checked-in migrations only and does not reconcile the live database to `schema.prisma`. Generate and review a migration, handle existing data safely, and test it against a production-like database backup.

2. **Refresh tokens are not safe to release as implemented.** `verifyToken()` accepts refresh JWTs as bearer access tokens because it does not reject the `tokenType: "refresh"` claim. `persistRefreshTokenHash()` suppresses DB errors, while refresh accepts a token when the stored hash is missing. Both tokens are stored in `localStorage`. Reject wrong token types, require a matching stored hash, propagate persistence failures, use a separate refresh secret/audience, and prefer secure HttpOnly/SameSite cookies or explicitly accept the XSS exposure.

3. **Production environment validation permits unsafe defaults.** `DATABASE_URL` and `JWT_SECRET` have defaults, and AI keys are optional. Ensure production boot fails when critical values are missing, empty, local, or known placeholders. `DIRECT_URL` must be available for migrations. Set `CLIENT_URL` to exact production frontend origins; Vercel's rewrite config does not set `VITE_API_BASE_URL`.

4. **Secret rotation and complete Git-history removal are not independently confirmed.** Root `.env` and `server/.env` remain on disk but are ignored and not tracked in the current Git index. Confirm every formerly exposed database/JWT/AI credential was revoked and replaced in provider dashboards, and coordinate any history rewrite across branches, tags, forks, and collaborator clones. Keep local env files untracked.

### 🟠 High-Priority Reliability / Operational Risks

5. **Sentry is scaffolding, not functioning monitoring.** `@sentry/node` and `@sentry/react` are absent from dependency manifests. Server capture is not wired into the central error handler and the client swallows import failure. Install/configure SDKs, wire exception capture, and verify a test event reaches the intended project before claiming monitoring coverage.

6. **The ATS scheduler is in-process and partial failures are hidden.** The daily interval runs in every server instance, is not a durable scheduled job, and has no distributed lock. Individual source failures are discarded by `Promise.allSettled`; scheduled sync does not deactivate stale records across all live sources. Prefer one external scheduler/worker with locking, per-source outcomes, and alerting. Verify curated titles, salary figures, and links against real vacancies before displaying them as current postings.

7. **CD workflow does not itself run Playwright or schedule sync.** CI/CD workflows exist and their unit/build steps are configured, but browser tests are not in CI. The CD file has push/manual triggers and deploy-hook secrets are optional; missing hooks intentionally skip deployment. Confirm Render/Vercel Git integration or configure hooks, and separately schedule/monitor sync if not using the web-process timer.

8. **Local test evidence is not production integration evidence.** The two Playwright tests mock API calls. There is no demonstrated live database migration, provider API health test, production CORS smoke test, or cross-origin refresh test. Add staging smoke checks for health, auth/refresh/logout, resume upload, interview evaluation, and one sync per provider using non-production data.

### 🟡 Remaining Product / Quality Work

9. **Skill matching is improved, not complete.** The dictionary has 128 canonical entries and exact-match fallback, but no fuzzy matching or taxonomy/versioning. Review ambiguous aliases and false positives, and surface insufficient-data cases rather than implying a precise score.

10. **Defensibility calculations are inconsistent.** The matching tactical matrix weights unverified claims at 0.5; readiness uses 0.4. Choose one documented definition or label the scores distinctly.

11. **Interview evaluation has a compatibility workaround.** Final evaluation still repairs the misspelled `confidance` field before Zod validation. Prefer a single canonical prompt/schema and a narrowly tested normalization step; malformed output should remain an explicit error.

12. **Resume privacy and retention need an explicit policy.** Original files are not retained, but extracted raw text and parsed resume data are stored. Document retention/deletion, ensure logs and monitoring do not capture resume contents, and define access/backup protections.

13. **Frontend bundle warning.** The current production build succeeds but emits a 546.79 kB minified JS chunk warning. Consider route-level lazy loading and analyze bundle composition before further feature growth.

### Deployment Opinion

The reported checklist work is meaningful and local verification is encouraging, but I would **not** call this production-ready yet. First add and test the missing Prisma migration, harden refresh-token validation/persistence, and make production env validation fail closed. Then confirm secret rotation/history cleanup, install and test Sentry if monitoring is part of launch requirements, and move ATS syncing to a reliable single-runner schedule with visible failure reporting. After those gates, deploy to staging and run real API/database/provider smoke tests before production.