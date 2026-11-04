# Architecture

TrueHire follows a layered full-stack architecture with clear separation between UI, API, business logic, data access, and external integrations.

## High-Level Architecture

```text
React Client
    ↓ HTTP / REST
Express API
    ↓
Controllers
    ↓
Services
    ↓
Repositories
    ↓
Prisma ORM
    ↓
PostgreSQL

External Integrations
    ├── Groq AI
    ├── NVIDIA NIM
    ├── Google Gemini
    ├── Ollama
    └── Greenhouse Job Board API
```

## Backend Layers

### Routes

Routes define HTTP endpoints and apply middleware such as authentication, validation, upload handling, and rate limiting.

### Controllers

Controllers handle request/response logic. They do not contain business rules.

### Services

Services contain the core business logic:

- Resume analysis
- Job matching
- Interview generation
- Answer evaluation
- Readiness calculation
- Application tracking
- Greenhouse synchronization

### Repositories

Repositories isolate database access using Prisma. This keeps SQL/Prisma queries out of business logic.

### Integrations

Integrations communicate with third-party systems:

- AI providers
- Greenhouse job boards
- Future Lever and Ashby boards

## Frontend Architecture

The React frontend uses a feature-based structure:

```text
src/features/
├── auth/
├── dashboard/
├── interview/
├── jobs/
├── matching/
├── readiness/
├── resume/
├── tailoring/
└── tracker/
```

Each feature contains:

- Pages
- API clients
- Custom hooks
- TypeScript types
- Feature-specific components

## AI Flow

```text
User Input
    ↓
Controller
    ↓
Service
    ↓
Prompt Builder
    ↓
AI Provider
    ↓
Raw JSON Response
    ↓
JSON Parser
    ↓
Zod Validation
    ↓
Database
```

AI output is never trusted directly. Every AI response is parsed and validated before persistence.

## Job Sync Flow

```text
Greenhouse Job Board
    ↓
HTTP Request
    ↓
Zod Validation
    ↓
Greenhouse Adapter
    ↓
Canonical Job Model
    ↓
Upsert into PostgreSQL
    ↓
Deactivate Missing Jobs
```

## Closed Loop

```text
Resume Skills
    +
Job Requirements
    ↓
Skill Gaps
    ↓
Targeted Interview
    ↓
Answer Evaluation
    ↓
Skill Evidence
    ↓
Updated UserSkill Profile
    ↓
Improved Future Matching
```
