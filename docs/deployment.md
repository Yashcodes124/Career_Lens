# Production Deployment Guide

TrueHire deploys as two independently scalable services backed by a managed PostgreSQL 15 database:

- **Backend API (`server/`):** Deployed on **Render** using the blueprint in `render.yaml`.
- **Frontend SPA (`client/`):** Deployed on **Vercel** using the SPA rewrite and security header rules in `client/vercel.json`.
- **CI/CD Automation:** Managed by `.github/workflows/ci.yml`, `.github/workflows/cd.yml`, and `.github/workflows/e2e.yml`.

## Production Build Steps

### Backend (`server/`)

```bash
cd server
npm ci
npx prisma generate
npm run build
```

Start command (applies pending Prisma migrations before booting Express):

```bash
npx prisma migrate deploy && npm start
```

### Frontend (`client/`)

```bash
cd client
npm ci
VITE_API_BASE_URL=https://<your-api-domain>/api npm run build
```

The Vite build outputs static assets to `client/dist/` with manual vendor chunking (`react-vendor`, `query-vendor`, `icons-vendor`, `motion-vendor`) and route-level `React.lazy` splitting.

## Production Environment Requirements

When `NODE_ENV=production`, `server/src/config/env.ts` runs `validateProductionEnv()` at boot and **exits with code 1** if any of these security checks fail:

1. **`JWT_SECRET`** must be explicitly set and at least **32 characters** long (the development default is rejected).
2. **`DATABASE_URL`** must be explicitly configured (the local Postgres fallback is rejected).
3. **`CLIENT_URL`** must contain explicit frontend origin(s) (e.g., `https://your-app.vercel.app`) — wildcard `*` is rejected when CORS credentials are enabled.

Additional production recommendations:

- Set a distinct **`JWT_REFRESH_SECRET`** (>= 32 characters; auto-generated via `render.yaml`).
- Set **`DIRECT_URL`** alongside `DATABASE_URL` when using connection poolers (e.g., Neon or Supabase PgBouncer) so `prisma migrate deploy` executes cleanly.
- Configure at least one AI provider key (`GROQ_API_KEY` / `AI_API_KEY`) and optionally `NVIDIA_API_KEY` for automatic provider failover.
- Never set `AI_E2E_MOCK=true` in production (it is hard-disabled when `NODE_ENV=production`).
- Optionally set `SENTRY_DSN` (backend) and `VITE_SENTRY_DSN` (frontend) for exception monitoring.

## Deploying the Backend on Render (`render.yaml`)

1. Connect the repository to [Render](https://render.com/) using **Blueprint (`render.yaml`)**.
2. `render.yaml` provisions the `truehire-api` Node web service with:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && npm start`
   - **Health Check Path:** `/api/health`
   - **Auto-generated secrets:** `JWT_SECRET` and `JWT_REFRESH_SECRET`
3. Set the remaining `sync: false` secrets in the Render dashboard:
   - `DATABASE_URL` and `DIRECT_URL`
   - `CLIENT_URL` (your Vercel production URL)
   - `SERVER_URL` (your Render service URL)
   - `AI_API_KEY` (or `GROQ_API_KEY`) and optional `NVIDIA_API_KEY`
4. Confirm `GET https://<render-url>/api/health` returns `200 OK` with `"database": "connected"`.

## Deploying the Frontend on Vercel (`client/vercel.json`)

1. Import the repository into [Vercel](https://vercel.com/) and set **Root Directory** to `client`.
2. Vercel auto-detects Vite (`npm run build`, output directory `dist`).
3. Configure environment variables in Vercel Project Settings:
   - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`
   - `VITE_SENTRY_DSN` (optional)
4. `client/vercel.json` automatically configures:
   - Client-side SPA routing fallback (`/(.*)` -> `/index.html`).
   - Hardened HTTP response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).

![Admin Operations Console](./images/admin-console.png)

## CI/CD Workflows (`.github/workflows/`)

| Workflow File | Trigger | Pipeline Steps |
| --- | --- | --- |
| `ci.yml` | Push / PR to `main`, `master` | **Server:** `npm ci` -> `prisma generate` -> `tsc --noEmit` -> `npm test`. **Client:** `npm ci` -> `npm test` -> `npm run build`. |
| `cd.yml` | Push to `main` / manual dispatch | Runs full server + client verification, then invokes optional `RENDER_DEPLOY_HOOK_URL` and `VERCEL_DEPLOY_HOOK_URL` repository secrets to trigger zero-touch deployments. |
| `e2e.yml` | Pull request / manual dispatch | Boots a Postgres 15 service container, pushes Prisma schema, installs Playwright Chromium, and executes `npm run test:e2e` with `AI_E2E_MOCK=true`, uploading the Playwright HTML report on failure. |

## Post-Deployment Verification Checklist

- [ ] `GET /api/health` returns `200` with `database: "connected"` and `aiConfigured: true`.
- [ ] Registration, login, token refresh (`POST /api/auth/refresh`), and logout (`POST /api/auth/logout`) succeed with no CORS errors.
- [ ] Admin account can access `/admin`, view ATS/AI/parse telemetry, and trigger `POST /api/jobs/sync`.
- [ ] Non-admin user receives `403` on `/api/admin/*`, `POST /api/jobs/sync`, and `POST /api/ontology/review-queue/resolve`.
- [ ] External job descriptions render sanitized formatting with zero console/CSP errors.
