# Deployment Guide

## Recommended Architecture

```text
Vercel / Netlify
    ↓
Render / Railway / VPS
    ↓
Supabase PostgreSQL
    ↓
Groq AI
```

## Backend Deployment

### 1. Set Environment Variables

Configure the following in your hosting provider:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=[https://your-frontend-domain.com](https://your-frontend-domain.com)
SERVER_URL=[https://your-backend-domain.com](https://your-backend-domain.com)

AI_PROVIDER=groq
GROQ_API_KEY=
GROQ_BASE_URL=[https://api.groq.com/openai/v1](https://api.groq.com/openai/v1)
GROQ_MODEL=qwen/qwen3.8-27b
```

### 2. Build and Start

```bash
cd server
npm install
npm run build
npx prisma migrate deploy
npm start
```

## Frontend Deployment

### 1. Set Environment Variable

```env
VITE_API_URL=[https://your-backend-domain.com](https://your-backend-domain.com)
```

### 2. Build

```bash
cd client
npm install
npm run build
```

### 3. Deploy

Deploy the `client/dist` directory to Vercel, Netlify, or Cloudflare Pages.

## Post-Deployment Checklist

- [ ] Backend health check passes.
- [ ] Frontend can call backend API.
- [ ] CORS allows only the production frontend domain.
- [ ] JWT secret is strong and private.
- [ ] Database migrations have run.
- [ ] AI provider keys are configured.
- [ ] Greenhouse sync works.
- [ ] Resume upload works.
- [ ] Interview flow works.
- [ ] Error logging is enabled.
