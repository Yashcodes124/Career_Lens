# TrueHire - AI-Powered Career Readiness Platform

TrueHire is an end-to-end career readiness platform for verified job discovery, resume parsing, explainable resume-to-job matching, skill-gap analysis, mock AI interviews, evaluation reports, resume tailoring, and application tracking.

## Stage 0 Status

Stage 0 is the foundation baseline:

- React + TypeScript + Vite frontend shell
- Express + TypeScript backend API
- PostgreSQL with Docker Compose
- Prisma schema and baseline migration
- Shared environment template
- Health endpoint with database connectivity telemetry
- Frontend API client and health monitor
- Initial API specification
- Build and health endpoint test coverage

The next planned stage is Stage 1: authentication and profile.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, TanStack Query
- Backend: Node.js, Express, TypeScript, Zod
- Database: PostgreSQL, Prisma ORM
- Tooling: Docker Compose, ESLint, Prettier, Vitest

## Repository Structure

```text
truehire/
  client/
    src/
      app/
      components/
      features/
      hooks/
      lib/
      services/
      types/
  server/
    prisma/
      migrations/
      schema.prisma
    src/
      config/
      controllers/
      integrations/
      middleware/
      repositories/
      routes/
      services/
      types/
      utils/
      validators/
  docs/
  templates/
  docker-compose.yml
  .env.example
  README.md
```

## Quick Start

Prerequisites:

- Node.js 18 or newer
- Docker and Docker Compose
- npm

Create environment files:

```powershell
Copy-Item .env.example server\.env
Copy-Item .env.example client\.env
```

Start PostgreSQL:

```powershell
docker compose up -d
```

Install and prepare the backend:

```powershell
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Backend health check:

```text
http://localhost:5000/api/health
```

Install and run the frontend:

```powershell
cd client
npm install
npm run dev
```

Frontend app:

```text
http://localhost:5173
```

On Windows PowerShell, if `npm` is blocked by script execution policy, use `npm.cmd` for the same commands.

## Verification

Backend:

```powershell
cd server
npm.cmd run build
npm.cmd test
```

Frontend:

```powershell
cd client
npm.cmd run build
```

Prisma migration check:

```powershell
cd server
npx.cmd prisma migrate diff --from-empty --to-schema-datamodel prisma\schema.prisma --script
```

## Current API

```text
GET /api/health
```

Returns service status, version, timestamp, uptime, and database connectivity.

## Product Build Order

1. Stage 1: Auth and profile
2. Stage 2: Resume upload, parsing, extraction, and profile display
3. Stage 3: Verified Greenhouse job ingestion
4. Stage 4: Job feed and job detail
5. Stage 5: Deterministic matching and skill gaps
6. Stage 6: Mock interview setup and live interview
7. Stage 7: Evaluation report
8. Stage 8: Closed-loop skill-gap updates
9. Stage 9: Resume tailoring
10. Stage 10: Application tracker

The project should continue vertically: each stage should connect UI, API, database, and visible result before moving to the next major stage.
