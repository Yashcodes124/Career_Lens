# CURRENT_STATE.md — TrueHire / Career_Lens

> **Last updated:** 2026-11-12 | **Status:** Pre-Deployment Ready (Full-Stack Light Design System & Closed-Loop Verified)
> **Scope:** Every file in `server/src/`, `client/src/`, `server/prisma/`, `docs/`, and all root configuration files.

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
| **Auth** | JWT (jsonwebtoken 9) + bcryptjs | 7-day Bearer tokens stored in `localStorage['truehire_auth_token']` |
| **File Upload & Parsing** | Multer 2 (memory storage, 5 MB limit) + pdf-parse 2 + mammoth 1.12 | In-memory PDF and DOCX text extraction (≥40 chars required) |
| **AI / LLM** | OpenAI-compatible SDK (openai v7) | Supports Groq, NVIDIA NIM, Gemini, and Ollama via `AI_BASE_URL` + `AI_API_KEY` |
| **Validation & Security** | Zod 3, Helmet 7, strict CORS, express-rate-limit 7 | 4 rate-limit tiers (globalRateLimiter, authLimiter, uploadLimiter, aiLimiter) |
| **Backend Testing** | Vitest 1 + Supertest 7 | 10 test suites in `server/src/__tests__/` (`npm test`) |
| **Deployment Configs** | `render.yaml` (Backend) + `client/vercel.json` (Frontend SPA) | Ready for Render + Vercel + Supabase deployment |

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
        │   ├── ai/               ← aiClient.ts, nvidiaClient.ts, resumePrompt.ts, resumeSchema.ts
        │   └── jobs/greenhouse/  ← greenhouseAdapter.ts, greenhouseClient.ts, greenhouseSchema.ts
        ├── middleware/           ← authMiddleware.ts, rateLimit.ts, requireRole.ts, uploadMiddleware.ts
        ├── modules/
        │   ├── evaluation/       ← finalEvaluationSchema.ts, interview.evaluation.prompt.ts
        │   └── interview/        ← interview.ai.ts, interview.prompt.ts, interview.question.prompt.ts, interviewSchema.ts
        ├── repositories/         ← 8 repositories (application, interview, job, match, resume, savedJob, skill, user)
        ├── routes/               ← 7 route modules (application, auth, interview, job, match, readiness, resume)
        ├── scripts/              ← verifyAi.ts (manual AI connectivity test)
        ├── services/             ← authService, applicationService, greenhouseSyncService, interviewService,
        │                            jobService, savedJobService, matching/, readiness/, resume/, skills/, tailoring/
        ├── utils/                ← appError.ts, documentParser.ts, jobQuery.ts, jwt.ts, parseModelJson.ts, password.ts
        ├── validators/           ← authValidator.ts, resumeValidator.ts
        └── __tests__/            ← 10 Vitest test files + fixtures/
```

---

## 2. Feature & Subsystem Status Matrix

| Subsystem | Implemented? | Key Files (Backend & Frontend) | How It Currently Works | Current Limitations / Edge Cases |
|---|---|---|---|---|
| **Auth, Onboarding & User Profile** | ✅ Fully wired E2E | BE: `routes/auth.ts`, `controllers/authController.ts`, `services/authService.ts`, `validators/authValidator.ts`, `repositories/userRepository.ts` FE: `AuthContext.tsx`, `services/authApi.ts`, `LoginForm.tsx`, `RegisterForm.tsx`, `OnboardingWizard.tsx`, `ProfileSetupForm.tsx`, `UserProfileCard.tsx` | Register creates bcrypt-hashed user, signs 7-day JWT. Login verifies hash, returns same shape. `GET /api/auth/me` hydrates the AuthContext on page load. `PUT /api/auth/profile` updates `targetRole`, `preferredLocations`, `experienceLevel`. Token stored in `localStorage['truehire_auth_token']`. On 401, a custom DOM event `truehire:unauthorized` clears AuthContext. | No token refresh — 7-day expiry means hard logout. Password change is supported server-side but no UI form for it. Email change is guarded against duplicates but no email-verification step. `OnboardingWizard` exists but is a separate component from `ProfileSetupForm`; both paths reach `PUT /api/auth/profile`. `/profile-setup` and `/onboarding` are separate routes pointing to different forms. |
| **Resume Upload & Parsing** | ✅ Fully wired E2E | BE: `routes/resumeRoutes.ts`, `controllers/resumeController.ts`, `services/resume/resumeService.ts`, `utils/documentParser.ts`, `integrations/ai/resumePrompt.ts`, `integrations/ai/resumeSchema.ts`, `repositories/resumeRepository.ts`, `middleware/uploadMiddleware.ts` FE: `features/resume/resumeApi.ts`, `ResumeUploader.tsx`, `ResumePage.tsx`, `ResumeParsedPreview.tsx`, `useResumes.ts` | Multer (memory storage, 5 MB limit, `resume` field, PDF/DOCX only) buffers the file. `extractTextFromDocument()` calls `pdf-parse` or `mammoth`. Minimum 40 readable characters enforced. Text sent to LLM via `analyzeResumeText()` with retry (up to 2 attempts). AI response validated with Zod (`resumeAnalysisSchema`). Skills deduplicated by `cleanSkillList()`. Stored in `resumes` table with `rawText`, `parsedData` (JSON), `skills[]`, `experienceYrs`. Delete is user-scoped. | Files are **never persisted to disk** — buffer only. `filePath` column in schema is never populated. Scanned/image PDFs fail with a clear error but no fallback OCR. The `resumeValidator.ts` file exists but appears unused (validation done in service). No resume editing or re-analysis after upload. |
| **Skill Extraction & Normalization** | ✅ Fully deterministic | BE: `services/matching/skillDictionary.ts`, `services/matching/skillNormalizer.ts`, `services/matching/jobSkillExtractor.ts`, `services/resume/resumeService.ts` | 43-entry `SKILL_DICTIONARY` with canonical names and aliases (e.g., "ReactJS" → "react"). `normalizeSkill()` lowercases, trims, and applies alias map. `countSkillMentions()` uses whole-word regex patterns (longest-first alternation), preventing "JavaScript" matching as "java". `extractJobSkills()` applies the same dictionary to job descriptions at Greenhouse sync time. `cleanSkillList()` deduplicates resume skills case-insensitively, capped at 100. | Dictionary has only 43 canonical skills. Any skill outside the dictionary keeps its raw lowercase form — it still matches but cannot be alias-normalized. No fuzzy matching. `Resume.skills` stores raw LLM-extracted skill names; normalization only happens at match/tailoring time, not at storage time. |
| **Job Sync & Exploration (Greenhouse / ATS)** | ✅ Greenhouse implemented; Lever & Ashby stubs only | BE: `routes/jobRoutes.ts`, `controllers/jobController.ts`, `services/jobService.ts`, `services/greenhouseSyncService.ts`, `integrations/jobs/greenhouse/` (3 files), `repositories/jobRepository.ts`, `utils/jobQuery.ts` FE: `features/jobs/jobsApi.ts`, `JobsPage.tsx`, `SavedJobsPage.tsx`, `JobCard.tsx` | `fetchGreenhouseJobs()` calls `https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true`, validates with Zod, strips HTML, calls `extractJobSkills()` on description, upserts into `jobs` table. Stale jobs (not in latest sync) are set `isActive=false`. `GET /api/jobs` supports `q` (title/company text search), `location`, `source`, `page`, `pageSize` (max 100) query params via `parseJobQuery()`. `POST /api/jobs/external` allows manual import of non-Greenhouse jobs. `POST /api/jobs/sync/greenhouse` requires `ADMIN` role; `POST /api/jobs/sync` does not. | No scheduled sync — must be triggered manually via API. Lever and Ashby folders contain only README.md placeholders. Salary range is always `null` for Greenhouse jobs (Greenhouse public API doesn't expose it). `Job.source` is a plain string (not an enum), so invalid sources can be stored. No pagination UI on the frontend — `fetchJobs()` always requests `pageSize=100`. Job search/filter UI state is not documented (need to verify JobsPage). |
| **Job Match Scoring Engine** | ✅ Fully deterministic, E2E wired | BE: `routes/matchRoutes.ts`, `controllers/matchController.ts`, `services/matching/matchService.ts`, `services/matching/matchingService.ts`, `repositories/matchRepository.ts` FE: `features/matching/matchingApi.ts`, `MatchPage.tsx`, `MatchResult.tsx` | `calculateMatch()`: normalizes both resume skills and job requirements via the alias dictionary. `InterviewEvidence` (from `UserSkill` table) is factored in — STRONG skills are credited even if not on resume; WEAK skills are **not** credited even if on resume. Score = `matchedCount / requiredCount * 100` (integer). `calculateTacticalMatrix()` computes a Defense/Offense breakdown: Fortified (verified strong), Unverified Claims (on resume, not interviewed), Exposed Weaknesses (flagged weak). Result upserted to `applications` table via `upsertApplicationMatch()`. | Score returns `null` (not 0) when job has no recognized skills — `INSUFFICIENT_DATA`. Dictionary limitation means jobs with unusual skills produce low/null scores. No LLM involved in scoring — purely deterministic. Frontend calls `POST /api/matches` (aliased from `/api/match` in app.ts). |
| **Skill Gap Analysis** | ✅ Fully wired E2E | BE: same as match scoring (embedded in match response) FE: `features/matching/SkillGapPage.tsx`, `features/matching/skillResources.ts` | Skill gaps are the `missingSkills` from `calculateMatch()`, ranked by mention frequency in the job description: 3+ mentions = high, 2 = medium, 1 or less = low. If a skill was flagged WEAK in a previous interview it gets priority "high" with a specific evidence string. Stored as `skillGaps: String[]` on the `Application` record. | Only dictionary-known skills appear in gaps. No LLM-generated remediation suggestions. `skillResources.ts` appears to map skill names to learning resources (static data). |
| **Resume Tailoring Workbench** | ✅ Fully wired E2E (deterministic, no LLM) | BE: `routes/resumeRoutes.ts` (`POST /:id/tailoring`), `controllers/resumeController.ts` (`tailorResumeController`), `services/tailoring/tailoringService.ts` FE: `features/tailoring/tailoringApi.ts`, `TailoringPage.tsx` | `buildTailoringSuggestions()`: iterates required job skills not in resume skill list. If resume raw text mentions the skill (via `countSkillMentions`), it goes into `addToSkills` (skill exists in experience, just not listed). Otherwise, it goes into `notOnResume` with a priority based on job posting frequency. Returns `suggestedSkills` = current skills + `addToSkills`. Fully deterministic — no LLM. | No AI-generated rewriting of resume sections. No "diff" view against original resume text. `tailoredText` column exists in `Application` model but is **never written to** — there is no service that populates it. Tailoring is advisory only; nothing is saved back to the database. The `Application.tailoredText` field is currently dead schema. |
| **Mock Interview Generation & Live Flow** | ✅ Fully wired E2E (LLM-driven) | BE: `routes/interviewRoutes.ts`, `controllers/interviewController.ts`, `services/interviewService.ts`, `modules/interview/` (4 files), `repositories/interviewRepository.ts` FE: `features/interview/interviewApi.ts`, `InterviewPreparationPage.tsx`, `LiveInterviewPage.tsx`, `InterviewsPage.tsx`, `types.ts` | **Plan creation (2 paths):** If user passes `durationMinutes`/`difficulty`/`focusTopics`, `buildCustomSkillPlan()` constructs the plan deterministically (no LLM, no latency). Otherwise `generateInterviewPlan()` calls the LLM with the full job + resume context and validates response with `InterviewPlanSchema`. **Question generation:** Always LLM via `buildInterviewQuestionsPrompt()` → `analyzeResume()`. Questions capped at 4-8 depending on duration. **Live flow:** `POST /:interviewId/start` sets status to `IN_PROGRESS` and returns first question. `POST /:interviewId/questions/:questionId/answer` enforces sequential order, saves answer, calls `evaluateQuestionAnswer()` (LLM) for per-question score/feedback. When all questions answered, status → `COMPLETED`. | Custom plan path uses a pre-wired round structure — no LLM for plan, but questions still require LLM. Answer submission is sequential and enforced server-side (out-of-order returns 409). No adaptive follow-up questions. `Interview.transcript` column exists but is never written. Answer evaluation uses `roleTitle` (interview.title) but not the full job description. Requires an existing `Application` record — cannot create a standalone interview. |
| **Interview Evaluation & Profile Write-Back** | ✅ Fully wired E2E (LLM + DB transaction) | BE: `services/interviewService.ts` (`generateFinalEvaluationService`), `repositories/skillRepository.ts` (`saveEvaluationWithSkillEvidence`), `services/skills/skillEvidence.ts`, `modules/evaluation/` (2 files) FE: `features/interview/InterviewEvaluationPage.tsx`, `interviewApi.ts` (`generateInterviewEvaluation`) | `POST /:interviewId/evaluation` requires `COMPLETED` status. Idempotent — returns 409 if evaluation already exists. Builds `buildFinalEvaluationPrompt()` with all Q&A, scores, and job context. LLM response validated with `FinalEvaluationSchema`. `skillEvidenceFromReport()` scans `strengths[]` and `improvements[]` text with the skill dictionary to generate `SkillEvidence[]`. `saveEvaluationWithSkillEvidence()` atomically saves the `Evaluation` record **and** upserts `UserSkill` rows (STRONG/WEAK) in a single Prisma transaction. These skills feed back into future `calculateMatch()` calls. | Only dictionary skills (43 entries) are extracted from evaluation text. Free-text skills mentioned in the LLM evaluation but not in the dictionary are silently dropped. The `breakdown` JSON field on `Evaluation` inconsistently bundles `strengths`, `improvements`, and `recommendation` alongside the breakdown sub-scores (a schema design concern). There is a typo fix for `confidance` → `confidence` in the LLM response, indicating inconsistent LLM output. |
| **Saved Jobs & Application Tracker** | ✅ Fully wired E2E | BE: `routes/jobRoutes.ts` (save/unsave), `routes/applicationRoutes.ts`, `controllers/jobController.ts`, `controllers/applicationController.ts`, `services/savedJobService.ts`, `services/applicationService.ts`, `repositories/savedJobRepository.ts`, `repositories/applicationRepository.ts` FE: `features/jobs/jobsApi.ts`, `features/tracker/trackerApi.ts`, `TrackerPage.tsx`, `useApplications.ts` | Save: `POST /api/jobs/:id/save` creates a `SavedJob` row (unique per userId+jobId). Unsave: `DELETE /api/jobs/:id/save`. `GET /api/jobs/saved` returns saved jobs with job details. Applications: `POST /api/applications/job/:jobId` creates an `Application` record (upserted via match also). `GET /api/applications` returns all user applications with job info. `PATCH /api/applications/:id/status` accepts any `ApplicationStatus` enum value. `Application` also links to `Interview[]`. | There are **3 `console.log` debug statements** left in `applicationController.ts` (lines 108-111) that log raw request body and enum values — must be removed before production. `SavedJob` and `Application` are separate models with no direct link (a saved job ≠ an application). No bulk status update. No archived/deleted state for applications. |
| **UI Design System & Layout Shell** | ✅ Stable | FE: `components/layout/AppShell.tsx`, `Sidebar.tsx`, `TopNav.tsx`, `MobileNav.tsx`, `PageHeader.tsx`, `ContentContainer.tsx`, `components/ui/Primitives.tsx`, `components/ui/AceternityPrimitives.tsx` | `AppShell` supports 3 variants: `auth` (centered card), `minimal` (no nav), `workspace` (full sidebar + topnav). `Sidebar` renders navigation defined in `components/layout/navigation.ts`. `Primitives.tsx` exports reusable `Button`, `Card`, `Badge`, etc. `AceternityPrimitives.tsx` exports motion-enhanced components (Framer Motion). | No dark/light mode toggle (dark-only by design). No Storybook or component catalog. `NavBar.tsx` exists at root of `components/` but appears to be a legacy/unused file (layout uses `Sidebar` + `TopNav` instead). |
| **Testing & CI/Deployment** | ⚠️ Partial | BE: `server/src/__tests__/` (9 test files, Vitest), `server/package.json` (`"test": "vitest run"`), `render.yaml` FE: `@playwright/test` in devDeps — **zero Playwright test files found** | **Backend (Vitest):** `auth.test.ts` (password hashing, JWT, Zod validators), `matching.test.ts` (skill extraction, normalization, scoring, persistence), `closedLoop.test.ts` (skill evidence, next-action, closed-loop match), `hardening.test.ts` (requireRole, parseJobQuery, rate-limiter, saveJob guard), `tailoring.test.ts`, `resumeService.test.ts`, `resumeUpload.test.ts`, `resumeUpload.happy.test.ts`, `interviewFlow.test.ts`, `parseModelJson.test.ts`. **Frontend:** No tests. **CI:** No GitHub Actions or similar pipeline. `render.yaml` deploys server only via Render.com. | No E2E tests (Playwright installed but unused). No frontend unit tests at all. No CI pipeline. The `.env` file with real API keys and database credentials is **committed to the repo** (critical security issue). No coverage thresholds or reporting. |

---

## 3. Database Schema & Data Model

**Provider:** PostgreSQL 15 via Prisma 5.10. Connection pooled via pgBouncer (Supabase). `DIRECT_URL` used for migrations.

### Enums

| Enum | Values |
|---|---|
| `Role` | `USER`, `ADMIN` |
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
| `filePath` | `String?` | **Never populated** — file not persisted to disk |
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
| `source` | `String` | "GREENHOUSE", "LINKEDIN", etc. — no enum enforcement |
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
| `tailoredText` | `String? @db.Text` | **Never written to** — dead field |
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
| `transcript` | `Json?` | **Never written to** — dead field |
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
| `feedback` | `String? @db.Text` | JSON-stringified per-question LLM evaluation |
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

---

## 4. Backend API & Service Architecture

All endpoints under `/api/`. Global rate limit: 300 req / 15 min. Auth via `Authorization: Bearer <token>` header.

### Auth Domain — `/api/auth`

| Method | Path | Handler | Logic Type | Request → Response Summary |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | `authController.register` → `authService.register` | Deterministic (DB + bcrypt) | `{email, password, name}` → `{user, token}`. Rate-limited (10/15min). Duplicate email → 409. |
| `POST` | `/api/auth/login` | `authController.login` → `authService.login` | Deterministic (DB + bcrypt) | `{email, password}` → `{user, token}`. Rate-limited. Wrong creds → 401. |
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
| `POST` | `/api/jobs/sync` | `jobController.syncGreenhouseController` | External API (Greenhouse) + DB | No role guard. Body: `{boardToken?, company?}`. Falls back to env vars. Returns sync stats. |
| `POST` | `/api/jobs/sync/greenhouse` | `jobController.syncGreenhouseController` | External API + DB | **ADMIN role required.** Same logic as `/sync`. |
| `POST` | `/api/jobs/external` | `jobController.importExternalJobController` | Deterministic (skill extraction) + DB | Body: `{title, company, description, location?, source?, url?, salaryRange?}`. Extracts skills from description via dictionary. Returns `{success, job}`. |
| `GET` | `/api/jobs/saved` | `jobController.getSavedJobsController` | DB query | Returns `{success, jobs[]}` with job details. |
| `POST` | `/api/jobs/:id/save` | `jobController.saveJobController` | DB mutation | Creates `SavedJob` row. 404 if job not found or inactive. 409 if already saved (Prisma unique constraint). |
| `DELETE` | `/api/jobs/:id/save` | `jobController.unsaveJobController` | DB mutation | Removes `SavedJob` row. |

### Match Domain — `/api/matches` (also aliased at `/api/match`)

| Method | Path | Handler | Logic Type | Request → Response Summary |
|---|---|---|---|---|
| `POST` | `/api/matches` | `matchController.matchResumeToJobController` → `matchService.matchResumeToJob` | Deterministic (no LLM) | Body: `{resumeId, jobId}`. Fetches resume skills + job requirements + user's `UserSkill` records. Returns `{success, data: {score, matchedSkills[], missingSkills[], skillGaps[], applicationId, tactical}}`. Upserts `Application` row. |

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
| `PATCH` | `/api/applications/:id/status` | `applicationController.updateApplicationStatusController` | DB mutation | Body: `{status: ApplicationStatus}`. Validates against enum. Contains 3 debug `console.log` statements. |

### Readiness Domain — `/api/readiness`

| Method | Path | Handler | Logic Type | Request → Response Summary |
|---|---|---|---|---|
| `GET` | `/api/readiness` | `readinessController.getReadinessController` → `readinessService.getReadinessService` | Deterministic (DB aggregation) | Returns `{success, data: {skills[], nextAction, defenseSummary, offenseTargets[]}}`. Aggregates `UserSkill`, resumes, and applications. `decideNextAction()` is a priority-ordered rule engine. Defensibility score = (fortified×1 + unverified×0.4) / total skills × 100. |

### Health Check

| Method | Path | Handler | Notes |
|---|---|---|---|
| `GET` | `/api/health` | Inline in `app.ts` | Runs `SELECT 1` on DB. Returns status, timestamp, env, `aiConfigured` boolean. |

---

## 5. Frontend Routes & State Wiring

All routes defined in [`client/src/App.tsx`](client/src/App.tsx). Auth state managed by `AuthContext` (React Context + localStorage). API calls via `apiClient` in `lib/api-client.ts` (fetch wrapper with auto-token injection).

| Route | Component File | API Endpoints Called | Mock/Fallback State? |
|---|---|---|---|
| `/` | `features/landing/LandingPage.tsx` | None | Static landing page |
| `/login` | `LoginPage` (inline in App.tsx) → `features/auth/LoginForm.tsx` | `POST /auth/login` | No. Error shown from API response. |
| `/register` | `RegisterPage` (inline) → `features/auth/RegisterForm.tsx` | `POST /auth/register` | No. Navigates to `/onboarding` on success. |
| `/onboarding` | `features/auth/OnboardingWizard.tsx` | `PUT /auth/profile` | No. Protected route, minimal shell. |
| `/dashboard` | `features/dashboard/DashboardPage.tsx` | Unknown (needs DashboardPage read) | Likely fetches resumes/skills — needs verification |
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
| `/skill-gap/:jobId` | `features/matching/SkillGapPage.tsx` | Likely reads from match result (cached/param) | Needs verification |
| `/skill-gaps/:jobId` | `features/matching/SkillGapPage.tsx` | Same as above. Duplicate route alias. | Same |
| `/tailor/:jobId` | `features/tailoring/TailoringPage.tsx` | `POST /resumes/:resumeId/tailoring` | No |
| `*` (404) | `NotFound` (inline in App.tsx) | None | Static 404 component |

**Token storage:** `localStorage['truehire_auth_token']`. On 401 from any non-auth endpoint, `window.dispatchEvent(new Event('truehire:unauthorized'))` is fired → AuthContext clears state.

**API base URL:** `VITE_API_BASE_URL` env var, defaults to `http://localhost:5000/api`. No proxy configured in Vite config.

---

## 6. Stable Foundation (What Is Working Well)

1. **Authentication end-to-end** — Register → Login → JWT → Protected routes → Profile update. Zod-validated inputs both server-side and client-side. Clean bcrypt + JWT implementation with graceful 401 handling.

2. **Resume upload pipeline** — Multer → pdf-parse/mammoth → LLM → Zod validation → PostgreSQL. Clear error messages for unsupported types, too-large files, and unparseable content. Up to 2 automatic retries on AI validation failure.

3. **Matching engine (fully deterministic)** — `calculateMatch()` and `calculateTacticalMatrix()` are well-tested, produce traceable numbers, and correctly incorporate interview evidence. Zero LLM dependency in the critical scoring path.

4. **Skill dictionary** — 43 canonical entries with whole-word regex matching. Correctly prevents "JavaScript" → "java" and "digital" → "git" false positives. Shared by extraction, normalization, scoring, tailoring, and skill evidence.

5. **Interview closed-loop** — The chain from interview answer evaluation → `skillEvidenceFromReport()` → `saveEvaluationWithSkillEvidence()` (atomic transaction) → `UserSkill` upsert → next `calculateMatch()` reflects evidence is fully wired E2E.

6. **Tailoring service** — Correctly identifies skills present in resume text but missing from the skills list (`addToSkills`) vs. skills genuinely absent (`notOnResume`). Fully deterministic, fast, and accurately prioritizes by job posting frequency.

7. **Readiness service** — `decideNextAction()` is a clean, testable, priority-ordered rule engine. Defense/offense telemetry aggregates across all applications and surfaces actionable insights. Correctly handles isolated unit test environments with a try/catch fallback.

8. **Backend test coverage** — 9 Vitest test files covering: auth utilities, JWT, Zod schemas, skill extraction, normalization, scoring, closed-loop, next action, rate limiting, role guard, job query parsing, save job guard, tailoring, resume service, resume upload (happy path + error paths), interview flow, and JSON parsing. Well-mocked repository layer.

9. **Error handling** — Centralized `AppError` class with HTTP status + error code. Global error handler in `app.ts` handles AppError, ZodError, Multer errors, and unhandled exceptions with consistent JSON shape `{success, code, message}`.

10. **Security layers** — Helmet headers, CORS, 4 rate-limit tiers (global, auth, upload, AI), JWT verification middleware, `requireRole()` for ADMIN-only endpoints, user-scoped repository queries preventing cross-user data access.

11. **Greenhouse sync** — Adapter pattern correctly strips HTML from job content, maps to `CanonicalJob`, upserts via `externalId`, and deactivates stale jobs atomically.

---

## 7. Technical Debt & Gaps Found in Code

### 🔴 Critical / Security

1. **`.env` committed with real secrets** — The `.env` file at repository root contains live database credentials (Supabase), JWT secret, Groq API key, NVIDIA API key, and Gemini API key. These must be rotated and the file must be removed from git history immediately.

2. **CORS effectively open** — `app.ts` CORS handler falls through to `callback(null, true)` for ALL origins (both branches of the `if/else` resolve to allow). The intent was to restrict to `CLIENT_URL`, but the `else` branch also allows instead of denying. This means any origin can make credentialed cross-origin requests.

3. **Debug `console.log` in production code** — `applicationController.ts` lines 108–111 log `req.body`, `req.body?.status`, the full `ApplicationStatus` enum, and all valid statuses on every PATCH request. Must be removed.

### 🟠 Architecture / Design Gaps

4. **`aiClient.ts` hardwires NVIDIA** — `integrations/ai/aiClient.ts` unconditionally re-exports `analyzeResumeWithNvidia`. Despite the README and `.env` documenting multi-provider support (Groq, Gemini, Ollama), the actual `AI_PROVIDER` env var is never read. All AI calls always use the NVIDIA/OpenAI-compat client regardless of `AI_PROVIDER=groq`. The `nvidiaClient.ts` does correctly pick up `AI_BASE_URL` and `AI_API_KEY`, so pointing those to Groq works, but the provider abstraction is incomplete.

5. **`Application.tailoredText` is dead schema** — The `tailoredText: String? @db.Text` field on `Application` is never written. The tailoring service returns suggestions but nothing persists them. If a tailored resume text feature is planned, the write path is missing.

6. **`Interview.transcript` is dead schema** — `transcript: Json?` on `Interview` is never written.

7. **`Resume.filePath` is never populated** — Files are held in memory only. If a future feature needs to re-process resumes, the original file is gone.

8. **`InterviewQuestion.feedback` stores JSON as a string** — The `feedback` column is `String? @db.Text` but `submitAnswerService` stores `JSON.stringify(evaluation)` in it. It should be a `Json?` column for consistency and queryability.

9. **Duplicate route aliases** — `/skill-gap/:jobId` and `/skill-gaps/:jobId` both map to `SkillGapPage`. Should pick one canonical path. Similarly `/api/matches` and `/api/match` are both registered, but the frontend client calls `/matches`.

10. **`Job.source` is `String`, not an enum** — Allows invalid source values. Should be `enum JobSource { GREENHOUSE LEVER ASHBY MANUAL LINKEDIN }` or similar.

11. **No token refresh** — JWTs are 7-day fixed expiry with no refresh mechanism. After expiry the user must log in again. There is no silent token renewal or refresh token pattern.

### 🟡 Logic / Edge Cases

12. **Interview creation requires an existing Application** — `createInterviewService` checks for `application.findFirst({ where: { id: applicationId, userId } })`. There is no way to create a standalone practice interview outside a job application context.

13. **Skill dictionary is small (43 skills)** — Jobs mentioning skills outside the 43-entry dictionary produce zero requirements, resulting in `INSUFFICIENT_DATA` matches. This is a significant functional gap for any job outside the core web/cloud skill set.

14. **Skill evidence extraction is dictionary-limited** — `skillEvidenceFromReport()` only extracts skills from evaluation text that appear in the 43-entry dictionary. Free-text skills mentioned in LLM evaluation feedback are silently ignored. A candidate who demonstrates competency in "Kubernetes" (in dictionary) is tracked; one who demonstrates "SOLID principles" (not in dictionary) is not.

15. **LLM responses not guaranteed consistent** — `generateFinalEvaluationService` has a manual typo fix (`confidance` → `confidence`) in the LLM response, indicating the LLM has produced inconsistent field names. Zod validation will catch other such errors but throw a 500 — there's no retry on final evaluation failures.

16. **`POST /api/jobs/sync` has no ADMIN guard** — `POST /api/jobs/sync` and `POST /api/jobs/sync/greenhouse` have the same handler but different role guards. Any authenticated user can trigger a Greenhouse sync via `/sync`.

17. **No pagination in frontend** — `fetchJobs()` always requests `pageSize=100`. With more data, this will degrade performance.

18. **`DashboardPage` not audited** — The `DashboardPage.tsx` file was not read during this audit. It likely fetches from multiple endpoints but its exact queries and any mock/fallback data are unknown.

19. **No Playwright E2E tests despite the dependency being installed** — `@playwright/test` is in `client/package.json` devDependencies but no test files exist. The testing contract ends at backend unit/integration tests.

20. **No CI/CD pipeline** — There are no GitHub Actions workflows. The only deployment config is `render.yaml` for the backend. Deployment of the frontend is manual.

21. **`local_data.sql` at repository root** — This file's purpose is undocumented and may contain seed data or sensitive information. It was not read during this audit.