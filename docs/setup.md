# Local Setup & Development Guide

## Prerequisites

| Requirement | Version / Details |
| --- | --- |
| **Node.js** | v20.x (matches `.github/workflows/ci.yml`) |
| **npm** | v10+ (bundled with Node 20) |
| **PostgreSQL** | v15+ (local installation or Docker via `docker-compose.yml`) |
| **AI Provider Key** | At least one of: Groq (`GROQ_API_KEY`), NVIDIA NIM (`NVIDIA_API_KEY`), Google Gemini (`GEMINI_API_KEY`), or a local Ollama instance (`OLLAMA_BASE_URL`) |

## Step-by-Step Local Installation

### 1. Clone and configure environment variables

```bash
cp .env.example .env
cp .env.example server/.env
```

Edit `server/.env` (and root `.env` if using Docker Compose) to set your local PostgreSQL credentials, `JWT_SECRET`, and an AI provider API key.

### 2. Start PostgreSQL

Using Docker Compose (exposes Postgres 15 on port `5433` by default):

```bash
docker compose up -d postgres
```

Verify the database container is healthy before applying migrations:

```bash
docker compose ps
```

### 3. Install dependencies

```bash
npm --prefix server install
npm --prefix client install
```

### 4. Generate Prisma Client, apply migrations, and seed data

```bash
npm --prefix server run prisma:generate
npx --prefix server prisma migrate deploy
npm --prefix server run prisma:seed
```

> Use `npm --prefix server run prisma:migrate` during schema development to create new migrations, or `npx --prefix server prisma migrate deploy` to apply existing migrations cleanly.

### 5. Run the application locally

Run both backend (port `5000`) and frontend (port `3000`, proxying `/api` to `http://localhost:5000`) from the repository root:

```bash
npm run dev
```

Or run them in separate terminals:

```bash
# Terminal 1 — Express API (http://localhost:5000)
npm run dev:server

# Terminal 2 — React Vite Client (http://localhost:3000)
npm run dev:client
```

Verify the API health endpoint:

```bash
curl http://localhost:5000/api/health
```

![Workspace Onboarding & Resume Intelligence](./images/resume-intelligence.png)

## Environment Variables

All supported variables are listed in `.env.example` and validated at startup by `server/src/config/env.ts`. Never commit real secrets.

### Core Runtime & Database

| Variable | Required | Default | Purpose & Where to Get It |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Runtime mode: `development`, `test`, or `production`. Enables strict startup security checks in `production`. |
| `PORT` | No | `5000` | Port for the Express API server. |
| `DATABASE_URL` | **Yes (prod)** | Local Postgres URL | PostgreSQL connection string (pooled connection URL in Neon/Supabase/Render). |
| `DIRECT_URL` | **Yes** | — | Direct (non-pooled) PostgreSQL URL required by Prisma migrations (`server/prisma/schema.prisma`). |
| `POSTGRES_USER` | Docker only | — | PostgreSQL username used by `docker-compose.yml`. |
| `POSTGRES_PASSWORD` | Docker only | — | PostgreSQL password used by `docker-compose.yml`. |
| `POSTGRES_DB` | Docker only | `career_lens` | PostgreSQL database name used by `docker-compose.yml`. |
| `POSTGRES_PORT` | Docker only | `5433` | Host port mapped to Postgres container port `5432`. |
| `CLIENT_URL` | **Yes (prod)** | `http://localhost:3000,http://localhost:5173` | Comma-separated allowed CORS origins for the frontend. Wildcard `*` is rejected in production. |
| `SERVER_URL` | No | `http://localhost:5000` | Public base URL of the backend API. |

### Authentication

| Variable | Required | Default | Purpose & Where to Get It |
| --- | --- | --- | --- |
| `JWT_SECRET` | **Yes (prod)** | Dev fallback | Signing secret for access tokens (must be >= 32 random chars in production; generate via `openssl rand -hex 32`). |
| `JWT_REFRESH_SECRET` | Recommended | Falls back to `JWT_SECRET` | Separate signing secret for refresh tokens (>= 16 chars; >= 32 recommended in production). |
| `JWT_EXPIRES_IN` | No | `7d` | Access token lifetime (e.g., `15m`, `1h`, `7d`). |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token lifetime (e.g., `7d`, `30d`). |

### AI Provider Routing

| Variable | Required | Default | Purpose & Where to Get It |
| --- | --- | --- | --- |
| `AI_PROVIDER` | No | `groq` | Primary LLM provider: `groq`, `nvidia`, `gemini`, or `ollama`. |
| `AI_API_KEY` | Optional | — | Generic API key fallback used if the provider-specific key is unset. |
| `AI_BASE_URL` | Optional | Provider default | Optional override for OpenAI-compatible API base URL. |
| `AI_MODEL` | Optional | Provider default | Optional override for primary model name. |
| `AI_TIMEOUT_MS` | No | `60000` | Request timeout in milliseconds before failing over or aborting. |
| `GROQ_API_KEY` | If using Groq | — | API key from [Groq Console](https://console.groq.com/). |
| `GROQ_BASE_URL` | No | `https://api.groq.com/openai/v1` | Groq OpenAI-compatible endpoint. |
| `GROQ_MODEL` | No | `qwen/qwen3.8-27b` | Primary Groq model for plans & analysis. |
| `GROQ_FAST_MODEL` | No | `openai/gpt-oss-20b` | Fast Groq model for lightweight tasks. |
| `GROQ_EVALUATION_MODEL` | No | `openai/gpt-oss-120b` | High-capacity Groq model for interview evaluation. |
| `NVIDIA_API_KEY` | If using NVIDIA | — | API key from [NVIDIA Build](https://build.nvidia.com/) (also acts as secondary failover provider). |
| `NVIDIA_BASE_URL` | No | `https://integrate.api.nvidia.com/v1` | NVIDIA NIM OpenAI-compatible endpoint. |
| `NVIDIA_MODEL` | No | `meta/llama-3.3-70b-instruct` | Default NVIDIA NIM model. |
| `GEMINI_API_KEY` | If using Gemini | — | API key from [Google AI Studio](https://aistudio.google.com/). |
| `GEMINI_BASE_URL` | No | `https://generativelanguage.googleapis.com/v1beta/openai/` | Gemini OpenAI-compatible endpoint. |
| `GEMINI_MODEL` | No | `gemini-flash-latest` | Default Gemini model alias. |
| `OLLAMA_BASE_URL` | If using Ollama | `http://localhost:11434` | Local Ollama server URL. |
| `OLLAMA_MODEL` | No | `qwen3:4b` | Local Ollama model tag. |
| `AI_E2E_MOCK` | Test only | `false` | Enables deterministic mock AI responses in non-production environments (blocked when `NODE_ENV=production`). |

### ATS Job Sync, Monitoring & Frontend

| Variable | Required | Default | Purpose & Where to Get It |
| --- | --- | --- | --- |
| `GREENHOUSE_BOARDS` | No | `stripe,razorpay,postman,browserstack,chargebee,druva,clevertap,zerodha,cloudflare,vercel,datadog` | Comma-separated public Greenhouse board slugs synced by the scheduler/admin console. |
| `GREENHOUSE_BOARD_TOKEN` | No | `stripe` | Default board token for single-board Greenhouse sync. |
| `GREENHOUSE_COMPANY` | No | `stripe` | Default company display label for single-board sync. |
| `GREENHOUSE_API_KEY` | Optional | — | Optional API key for private Greenhouse boards. |
| `LEVER_API_KEY` | Optional | — | Optional Lever ATS API key. |
| `ASHBY_API_KEY` | Optional | — | Optional Ashby ATS API key. |
| `ENABLE_STARTUP_JOB_SYNC` | No | `true` | Set to `false` to skip the initial 15-second post-boot ATS sync. |
| `JOB_SYNC_INTERVAL_HOURS` | No | `6` | Interval in hours for recurring background ATS job syncs. |
| `SENTRY_DSN` | Optional | — | Server Sentry DSN for capturing unhandled 500 exceptions. |
| `VITE_SENTRY_DSN` | Optional | — | Frontend Sentry DSN exposed to Vite client build. |
| `VITE_API_BASE_URL` | Prod client | `/api` | Backend API base URL used by `client/src/lib/api-client.ts` (defaults to `/api` for Vite proxy). |

## Available Scripts

### Root Monorepo (`package.json`)

| Script | Command | Description |
| --- | --- | --- |
| `npm run dev` | Starts server + Vite client on port `3000` | Runs Express API (with startup sync disabled) and Vite frontend together. |
| `npm run build` | `npm --prefix server run build && npm --prefix client run build` | Compiles both TypeScript backend and Vite frontend production bundles. |
| `npm run lint` | `npm --prefix server run build && npm --prefix client run build` | Runs full TypeScript compilation verification across server and client. |
| `npm start` | `npm --prefix server run start` | Starts the compiled Express backend (`server/dist/index.js`). |
| `npm run dev:server` | `npm --prefix server run dev` | Starts backend in watch mode (`tsx watch src/index.ts`). |
| `npm run dev:client` | `npm --prefix client run dev` | Starts Vite frontend dev server on port `3000`. |
| `npm run build:server` | `npm --prefix server run build` | Compiles server TypeScript to `server/dist`. |
| `npm run build:client` | `npm --prefix client run build` | Type-checks and builds client production bundle to `client/dist`. |
| `npm run test:server` | `npm --prefix server test` | Runs all backend Vitest unit/integration suites. |
| `npm run test:client` | `npm --prefix client test` | Runs all frontend Vitest unit tests. |
| `npm run test:e2e` | `npm --prefix client run test:e2e` | Runs Playwright end-to-end test suite against live client + API. |

### Server (`server/package.json`)

| Script | Description |
| --- | --- |
| `dev` | Runs `tsx watch src/index.ts` on `PORT` (default `5000`). |
| `build` | Compiles server TypeScript (`tsc`). |
| `start` | Runs `node dist/index.js`. |
| `test` | Executes `vitest run` across `server/src/__tests__/`. |
| `lint` / `lint:fix` | Runs ESLint across `.ts` files with `--max-warnings 0`. |
| `format` | Formats server codebase with Prettier. |
| `prisma:generate` | Generates Prisma Client from `server/prisma/schema.prisma`. |
| `prisma:migrate` | Runs `prisma migrate dev` for local schema changes. |
| `prisma:push` | Pushes schema directly to DB without generating migration files. |
| `prisma:seed` | Seeds sample data via `tsx prisma/seed.ts`. |
| `prisma:studio` | Opens Prisma Studio web GUI. |

### Client (`client/package.json`)

| Script | Description |
| --- | --- |
| `dev` | Starts Vite dev server on port `3000` (`0.0.0.0`, proxying `/api` to `localhost:5000`). |
| `build` | Runs `tsc && vite build` with manual vendor chunk splitting. |
| `preview` | Previews the built production `client/dist` bundle locally. |
| `test` | Runs Vitest (`vitest run --config vitest.config.ts`). |
| `test:e2e` | Runs Playwright E2E suite (`playwright test`). |
| `lint` / `lint:fix` | Runs ESLint across `.ts,.tsx` files. |
| `format` | Formats client codebase with Prettier. |
