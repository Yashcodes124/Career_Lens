# TrueHire

**TrueHire** is a full-stack AI-powered interview-readiness platform that helps candidates analyze resumes, discover verified engineering roles, identify skill gaps, practice targeted interviews, and improve through measurable feedback.

It is built around a closed-loop preparation workflow:

```text
Resume → Job Matching → Skill Gap Analysis → Targeted Interview → Evaluation → Updated Skill Profile
```

Instead of treating career preparation as a one-time resume score, TrueHire continuously updates a candidate’s skill profile using evidence from resumes and interview performance.

---

## 🚀 Features

### Authentication

- Email and password registration.
- Secure login with JWT-based sessions.
- Password hashing using bcrypt.
- Protected frontend and backend routes.
- User profile setup with target role, experience level, and preferred locations.
- Role-based access support.

### Resume Intelligence

- Upload PDF and DOCX resumes.
- Extract text using `pdf-parse` and `mammoth`.
- Analyze resumes using AI.
- Extract structured information:
  - Professional summary
  - Skills
  - Education
  - Work experience
  - Projects
  - Estimated experience
- Validate all AI responses using Zod.
- Store parsed resume data in PostgreSQL.
- Prevent users from accessing resumes owned by other users.

### Verified Job Discovery

- Sync public job listings from Greenhouse job boards.
- Normalize external ATS data into a canonical job model.
- Support companies such as Stripe, Vercel, Cloudflare, Datadog, and Discord.
- Store job title, company, location, description, requirements, salary range, and application URL.
- Automatically deactivate stale jobs after synchronization.
- Built with an adapter-based architecture for future Lever and Ashby support.

### Skill Matching

- Compare resume skills with job requirements.
- Generate a match score.
- Identify missing or weak skills.
- Normalize similar skill names using a skill dictionary.
- Extract relevant skills from job descriptions.
- Rank skill gaps based on their relevance to the target role.

### Interview Readiness

- Generate interview plans based on job requirements and skill gaps.
- Customize interviews by:
  - Duration
  - Difficulty
  - Focus skills
- Generate structured interview questions.
- Allow users to answer questions sequentially.
- Evaluate each answer using AI.
- Generate a final evaluation with strengths, weaknesses, feedback, and skill evidence.

### Closed-Loop Skill Profile

- Interview evaluations update the user’s persistent skill profile.
- Skills are marked as `STRONG` or `WEAK`.
- Skill evidence is linked to interview performance.
- Future matching and interview preparation adapt to user progress.

### Application Tracking

- Save jobs.
- Track application status.
- Link applications to interviews and skill gaps.
- Maintain a personalized job-search workflow.

---

## 🧠 How TrueHire Works

```text
1. Candidate uploads a resume
2. TrueHire extracts and analyzes resume content
3. Candidate browses verified engineering jobs
4. TrueHire calculates match score and skill gaps
5. Candidate starts a targeted mock interview
6. AI evaluates answers and provides feedback
7. Skill profile is updated with evidence
8. Future job matching and interview preparation improve
```

---

## 🛠 Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack React Query
- React Hook Form
- Zod

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Supabase
- JWT
- bcrypt
- Multer
- Helmet
- Express Rate Limit

### AI

- Groq
- NVIDIA NIM
- Google Gemini
- Ollama
- Zod schema validation

### Developer Tools

- Docker Compose
- Vitest
- Supertest
- ESLint
- Prettier
- Git
- GitHub

---

## 📁 Project Structure

```text
Career_Lens/
├── client/
│   ├── public/
│   │   └── landing/
│   └── src/
│       ├── components/
│       ├── features/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── interview/
│       │   ├── jobs/
│       │   ├── landing/
│       │   ├── matching/
│       │   ├── readiness/
│       │   ├── resume/
│       │   ├── tailoring/
│       │   └── tracker/
│       ├── hooks/
│       ├── lib/
│       ├── services/
│       └── types/
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── integrations/
│       │   ├── ai/
│       │   └── jobs/
│       ├── middleware/
│       ├── modules/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       ├── validators/
│       └── __tests__/
│
├── docs/
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL or Supabase
- Docker
- Groq API key
- NVIDIA API key, optional

### 1. Clone the Repository

```bash
git clone [https://github.com/Yashcodes124/Career_Lens.git](https://github.com/Yashcodes124/Career_Lens.git)
cd Career_Lens
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Update the `.env` file with your database, authentication, AI, and Greenhouse configuration.

Run migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

Start the backend:

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
GET /health
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## 🔐 Environment Variables

See [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) for the complete variable reference.

Important variables:

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

AI_PROVIDER=groq
GROQ_API_KEY=
GROQ_BASE_URL=[https://api.groq.com/openai/v1](https://api.groq.com/openai/v1)
GROQ_MODEL=qwen/qwen3.8-27b

NVIDIA_API_KEY=
NVIDIA_BASE_URL=[https://integrate.api.nvidia.com/v1](https://integrate.api.nvidia.com/v1)
NVIDIA_MODEL=meta/llama-3.1-70b-instruct

GREENHOUSE_BOARDS=stripe,vercel,cloudflare,datadog,discord
GREENHOUSE_BOARD_TOKEN=stripe
GREENHOUSE_COMPANY=stripe
```

Never commit real API keys, database credentials, or JWT secrets.

---

## 🤖 AI Models

TrueHire supports multiple AI providers through an OpenAI-compatible interface.

| Provider   | Recommended Model             | Use Case                                                                |
| ---------- | ----------------------------- | ----------------------------------------------------------------------- |
| Groq       | `qwen/qwen3.8-27b`            | Primary model for resume analysis, matching, interviews, and evaluation |
| Groq       | `openai/gpt-oss-20b`          | Fast fallback and lightweight AI tasks                                  |
| Groq       | `openai/gpt-oss-120b`         | High-quality final interview evaluation                                 |
| NVIDIA NIM | `meta/llama-3.1-70b-instruct` | Secondary provider and backup model                                     |
| Ollama     | `qwen3:4b`                    | Offline local development                                               |

For the best free and fast experience, use:

```env
AI_PROVIDER=groq
GROQ_MODEL=qwen/qwen3.8-27b
```

See [`docs/AI_MODELS.md`](docs/AI_MODELS.md) for detailed model comparisons and configuration.

---

## 🔌 API Overview

All protected routes require:

```http
Authorization: Bearer <access_token>
```

| Module       | Endpoint                            | Description                       |
| ------------ | ----------------------------------- | --------------------------------- |
| Health       | `GET /health`                       | Server health check               |
| Auth         | `POST /api/auth/register`           | Create a new account              |
| Auth         | `POST /api/auth/login`              | Authenticate a user               |
| Auth         | `GET /api/auth/me`                  | Get current user                  |
| Resumes      | `POST /api/resumes`                 | Upload and analyze a resume       |
| Resumes      | `GET /api/resumes`                  | Get user resumes                  |
| Resumes      | `GET /api/resumes/:id`              | Get a specific resume             |
| Jobs         | `GET /api/jobs`                     | Get available jobs                |
| Jobs         | `GET /api/jobs/:id`                 | Get job details                   |
| Jobs         | `POST /api/jobs/sync/greenhouse`    | Sync Greenhouse jobs              |
| Saved Jobs   | `POST /api/saved-jobs`              | Save a job                        |
| Applications | `POST /api/applications`            | Create an application             |
| Applications | `PATCH /api/applications/:id`       | Update application status         |
| Matching     | `POST /api/match`                   | Generate job match and skill gaps |
| Interviews   | `POST /api/interviews`              | Create an interview               |
| Interviews   | `POST /api/interviews/:id/answers`  | Submit an interview answer        |
| Interviews   | `POST /api/interviews/:id/evaluate` | Generate final evaluation         |
| Readiness    | `GET /api/readiness`                | Get readiness insights            |

Full API documentation is available in [`docs/API.md`](docs/API.md).

---

## 🗄 Database Schema

TrueHire uses PostgreSQL with Prisma ORM.

Core models:

- `User`
- `Resume`
- `Job`
- `SavedJob`
- `Application`
- `Interview`
- `InterviewQuestion`
- `Evaluation`
- `UserSkill`

See [`docs/DATABASE.md`](docs/DATABASE.md) for the complete data model.

---

## 🧪 Testing

Run backend tests:

```bash
cd server
npm run test
```

Test coverage includes:

- Authentication
- Resume upload and parsing
- Job matching
- Interview flow
- Tailoring
- Closed-loop skill updates
- AI JSON parsing
- API authorization and hardening

---

## 🔒 Security

- JWT authentication
- bcrypt password hashing
- Protected API routes
- User-scoped queries
- File-type validation
- Upload restrictions
- Rate limiting
- Helmet security headers
- CORS restrictions
- Role-based authorization
- Secure environment-variable handling

---

## 🚀 Deployment

### Backend

```bash
cd server
npm run build
npm start
```

### Frontend

```bash
cd client
npm run build
npm run preview
```

Recommended deployment setup:

- Frontend: Vercel, Netlify, or Cloudflare Pages
- Backend: Render, Railway, Fly.io, or VPS
- Database: Supabase PostgreSQL
- AI: Groq primary, NVIDIA NIM fallback

---

## 📌 Roadmap

- [ ] Complete Lever and Ashby ATS adapters
- [ ] Add scheduled background job synchronization
- [ ] Add adaptive follow-up interview questions
- [ ] Add role-specific interview rubrics
- [ ] Add evidence-preserving resume tailoring
- [ ] Add skill-readiness analytics
- [ ] Add recruiter dashboard
- [ ] Add public demo with seeded data
- [ ] Add CI/CD using GitHub Actions
- [ ] Add structured logging and error monitoring

---

## 📄 License

This project is licensed under the MIT License.
