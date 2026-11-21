# TrueHire

TrueHire is a closed-loop career readiness and technical interview preparation platform for software engineers. Candidates upload or paste a resume, benchmark their skills against live ATS job postings through a deterministic skill ontology, tailor resume bullets within strict evidence bounds, and complete adaptive AI mock interviews that write verified skill evidence back to their readiness profile.

![App Preview](./docs/images/preview.png)

## Key Features

- **Resume Intelligence & Evidence-Bounded Tailoring:** Parse PDF/DOCX or pasted resumes into structured profiles, inspect parse quality, and generate diffed tailoring suggestions without fabricating unverified claims.
- **Verified ATS Job Discovery & External Import:** Sync software engineering roles from Greenhouse/Lever/Ashby boards or import external postings with sanitized HTML rendering and strict URL validation.
- **Deterministic Matching, Skill-Gap Simulator & Role-Fit Radar:** Measure requirement coverage against a curated canonical skill ontology, simulate score lift from closing target gaps, and rank best-fit role families.
- **Adaptive Mock Interviews & Markdown Evaluation Export:** Run timed multi-round interviews with crash-safe answer persistence, adaptive follow-up questions, 6-dimension rubric scoring, and one-click Markdown report copy/export.
- **Closed-Loop Readiness Ledger & Application Tracker:** Automatically sync interview outcomes (`STRONG`/`WEAK`) and submitted skill proofs into your skill profile while managing your application pipeline.
- **Workspace Productivity & Admin Operations Control Plane:** Navigate instantly across views with the `Cmd/Ctrl + K` quick-jump palette; administrators monitor AI latency/cost, ATS sync health, parse diagnostics, and ontology review queues in `/admin`.

## Quick Start

```bash
# 1. Configure environment variables
cp .env.example .env && cp .env.example server/.env

# 2. Start PostgreSQL 15 via Docker
docker compose up -d postgres

# 3. Install dependencies
npm --prefix server install && npm --prefix client install

# 4. Generate Prisma client, apply migrations, and seed data
npm --prefix server run prisma:generate
npx --prefix server prisma migrate deploy
npm --prefix server run prisma:seed

# 5. Start both API (port 5000) and Client (port 3000)
npm run dev
```

Run automated checks:

```bash
npm run test:server   # Backend Vitest suites
npm run test:client   # Frontend Vitest suites
npm run build         # Full TypeScript + Vite production build
```

## Documentation

- [System Architecture](./docs/architecture.md) — Tech stack, folder structure, Mermaid architecture & closed-loop user flow diagrams, and core design patterns.
- [Local Setup & Environment](./docs/setup.md) — Prerequisites, installation steps, complete environment variable reference, and npm scripts.
- [API & Data Model](./docs/api-and-data.md) — Prisma schema, Mermaid ER diagram, and complete REST API endpoint reference.
- [Deployment Guide](./docs/deployment.md) — Production security requirements, Render & Vercel deployment steps, and GitHub Actions CI/CD workflows.
