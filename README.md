You're right. The previous formatting made copying unnecessarily difficult. I'll give you **one clean Markdown code block** for the README and then a **proper detailed commit message** separately.

### Updated `README.md`

````md
# Career Lens — TrueHire

TrueHire (Career Lens) is a full-stack career-readiness and verified job discovery platform designed to help candidates manage resumes, understand their skills, and discover relevant job opportunities.

The project is being developed incrementally with a focus on clean backend architecture, secure authentication, resume intelligence, and scalable data modeling.

## Project Status

Current development stage:

**Stage 2 — Resume Intelligence**

Completed:

- M2.1 — Resume Upload
- M2.2 — Document Text Extraction
- M2.3/M2.4 — Local AI Resume Analysis
- M2.5 — Resume Retrieval APIs

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express.js
- TypeScript
- REST APIs

### Database

- PostgreSQL
- Prisma ORM

### Authentication

- JWT
- bcrypt

### AI

- Ollama
- Qwen3:4b

### Document Processing

- pdf-parse
- Mammoth
- Multer

### Development Tools

- Git
- GitHub
- Postman
- Docker

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Career_Lens
```
````

### 2. Environment Setup

Create the required environment file:

```bash
cp .env.example .env
```

Configure the required environment variables, including:

- PostgreSQL connection
- JWT configuration
- Server configuration
- Client URL

### 3. Start PostgreSQL

PostgreSQL can be run locally or using Docker:

```bash
docker-compose up -d
```

### 4. Backend Setup

```bash
cd server
npm install
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Generate Prisma Client if required:

```bash
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

The backend currently runs on:

```text
http://localhost:5000
```

Health check:

```text
GET /health
```

### 5. Frontend Setup

From the project root:

```bash
cd client
npm install
npm run dev
```

---

# Implemented Features

## Authentication

Implemented JWT-based authentication with protected API routes.

Current authentication functionality:

- User registration
- User login
- Password hashing with bcrypt
- JWT authentication
- Protected routes
- Authenticated user retrieval through `/api/auth/me`

---

# Stage 2 — Resume Intelligence

## M2.1 — Resume Upload

Implemented authenticated resume upload using Multer.

Supported formats:

- PDF
- DOCX

Upload flow:

```text
Resume File
    ↓
Multer
    ↓
JWT Authentication
    ↓
Resume Service
```

Resume metadata and extracted information are stored in PostgreSQL.

Stored information includes:

- File name
- MIME type
- File size
- Resume title
- Raw extracted text
- Parsed AI analysis
- Skills
- Experience years

---

## M2.2 — Document Text Extraction

Implemented document text extraction for PDF and DOCX files.

Architecture:

```text
PDF / DOCX
    ↓
Multer
    ↓
extractTextFromDocument()
    ↓
Raw Text
    ↓
PostgreSQL
```

PDF files are processed using:

```text
pdf-parse
```

DOCX files are processed using:

```text
mammoth
```

The parser determines the document type using both:

- MIME type
- File extension

This provides a fallback for files that may be reported with a generic MIME type such as:

```text
application/octet-stream
```

---

## M2.3/M2.4 — Local AI Resume Analysis

Resume analysis is performed locally using Ollama instead of a paid external AI API.

Current model:

```text
qwen3:4b
```

The `qwen3:8b` model was tested but was not suitable for the available system memory, so the project uses `qwen3:4b`.

The following embedding model is also available for future functionality:

```text
nomic-embed-text
```

### AI Pipeline

```text
Resume File
    ↓
Document Text Extraction
    ↓
Raw Resume Text
    ↓
buildResumeAnalysisPrompt()
    ↓
Ollama
    ↓
Qwen3:4b
    ↓
Structured JSON
    ↓
JSON.parse()
    ↓
Zod Validation
    ↓
ResumeAnalysis
    ↓
PostgreSQL
```

The AI extracts structured information including:

- Professional summary
- Skills
- Education
- Experience
- Projects
- Total experience

The generated response is parsed and validated using Zod before being stored.

---

## M2.5 — Resume Retrieval APIs

Implemented authenticated APIs for retrieving resumes belonging to the current user.

### Get All Resumes

```http
GET /api/resumes
Authorization: Bearer <token>
```

Returns all resumes belonging to the authenticated user.

Resumes are ordered by:

```text
createdAt DESC
```

### Get Resume by ID

```http
GET /api/resumes/:id
Authorization: Bearer <token>
```

The individual resume query checks both:

```text
resumeId
+
userId
```

This prevents a user from accessing another user's resume by knowing its UUID.

---

# Resume API Architecture

The resume functionality follows a layered backend architecture:

```text
HTTP Request
     ↓
Route
     ↓
JWT Authentication Middleware
     ↓
Controller
     ↓
Service
     ↓
Repository
     ↓
Prisma
     ↓
PostgreSQL
```

The upload and AI analysis flow extends the service layer:

```text
Controller
    ↓
Resume Service
    ↓
Document Parser
    ↓
AI Prompt Builder
    ↓
Ollama / Qwen3:4b
    ↓
Zod Validation
    ↓
Resume Repository
    ↓
PostgreSQL
```

---

# API Routes

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Resumes

```text
POST /api/resumes
GET  /api/resumes
GET  /api/resumes/:id
```

All resume endpoints require JWT authentication.

---

# Resume Database Model

The current Prisma `Resume` model stores:

```text
id
userId
title
fileName
filePath
mimeType
fileSize
rawText
parsedData
skills
experienceYrs
createdAt
updatedAt
```

`parsedData` stores the validated structured AI resume analysis as JSON.

---

# Testing

Resume APIs have been tested using Postman.

The following cases have been successfully verified:

- Authenticated resume list retrieval
- Authenticated single-resume retrieval
- Request without authentication
- Request with an invalid JWT
- Request with a non-existent resume ID
- Cross-user resume access protection

The cross-user authorization check is implemented by querying the resume using both:

```text
resumeId
userId
```

Therefore, a user cannot retrieve another user's resume even if they know the resume UUID.

---

# Development Validation

TypeScript compilation is checked using:

```bash
npx tsc --noEmit
```

The current backend compiles successfully without TypeScript errors.

---

# Project Structure

```text
Career_Lens/
│
├── client/
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── integrations/
│   │   │   └── ai/
│   │   ├── middleware/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   │
│   ├── prisma/
│   └── package.json
│
├── docs/
├── docker-compose.yml
└── README.md
```

---

# Development Progress

```text
Stage 1 — Authentication & Backend Foundation       ✅

Stage 2 — Resume Intelligence

M2.1 — Resume Upload                              ✅
M2.2 — Document Text Extraction                   ✅
M2.3/M2.4 — Local AI Resume Analysis              ✅
M2.5 — Resume Retrieval APIs                      ✅
```

---

# Next Development Step

The next development step will build on the completed Resume Intelligence foundation.

Potential future areas include:

- Resume scoring and feedback
- Skill-gap analysis
- Job aggregation and normalization
- Resume-to-job matching
- Internship discovery
- Application tracking
- Frontend resume dashboard

These features are not considered implemented until they are completed and tested.

```

```
