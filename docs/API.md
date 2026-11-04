# API Documentation

Base URL:

```text
http://localhost:5000
```

All protected endpoints require:

```http
Authorization: Bearer <access_token>
```

## Health

### `GET /health`

Returns server health status.

**Response**

```json
{
  "status": "ok"
}
```

---

## Authentication

### `POST /api/auth/register`

Creates a new user account.

**Request Body**

```json
{
  "name": "Yash",
  "email": "yash@example.com",
  "password": "StrongPassword@123"
}
```

**Response**

```json
{
  "user": {
    "id": "uuid",
    "name": "Yash",
    "email": "yash@example.com"
  },
  "accessToken": "jwt_token"
}
```

### `POST /api/auth/login`

Authenticates an existing user.

**Request Body**

```json
{
  "email": "yash@example.com",
  "password": "StrongPassword@123"
}
```

### `GET /api/auth/me`

Returns the authenticated user.

---

## Resumes

### `POST /api/resumes`

Uploads and analyzes a resume.

**Content-Type**

```text
multipart/form-data
```

**Form Field**

```text
resume: PDF or DOCX file
```

**Response**

```json
{
  "id": "uuid",
  "title": "Backend Engineer Resume",
  "skills": ["Node.js", "TypeScript", "PostgreSQL"],
  "experienceYrs": 2,
  "parsedData": {}
}
```

### `GET /api/resumes`

Returns all resumes belonging to the authenticated user.

### `GET /api/resumes/:id`

Returns a specific resume.

---

## Jobs

### `GET /api/jobs`

Returns available jobs.

**Query Parameters**

| Parameter  | Type   | Description                |
| ---------- | ------ | -------------------------- |
| `search`   | string | Search by title or company |
| `location` | string | Filter by location         |
| `source`   | string | Filter by ATS source       |
| `page`     | number | Pagination page            |
| `limit`    | number | Results per page           |

### `GET /api/jobs/:id`

Returns a single job.

### `POST /api/jobs/sync/greenhouse`

Synchronizes jobs from a Greenhouse board.

**Request Body**

```json
{
  "boardToken": "stripe",
  "company": "Stripe"
}
```

---

## Saved Jobs

### `POST /api/saved-jobs`

Saves a job for the authenticated user.

**Request Body**

```json
{
  "jobId": "uuid"
}
```

### `GET /api/saved-jobs`

Returns saved jobs.

### `DELETE /api/saved-jobs/:id`

Removes a saved job.

---

## Applications

### `POST /api/applications`

Creates an application record.

**Request Body**

```json
{
  "jobId": "uuid",
  "status": "SAVED"
}
```

### `GET /api/applications`

Returns user applications.

### `PATCH /api/applications/:id`

Updates application status.

**Request Body**

```json
{
  "status": "APPLIED"
}
```

---

## Matching

### `POST /api/match`

Generates a match result between a resume and job.

**Request Body**

```json
{
  "resumeId": "uuid",
  "jobId": "uuid"
}
```

**Response**

```json
{
  "matchScore": 78,
  "matchedSkills": ["React", "TypeScript"],
  "skillGaps": ["System Design", "Testing"],
  "recommendations": []
}
```

---

## Interviews

### `POST /api/interviews`

Creates an interview for an application.

**Request Body**

```json
{
  "applicationId": "uuid",
  "durationMinutes": 30,
  "difficulty": "MEDIUM",
  "focusTopics": ["Node.js", "System Design"]
}
```

### `GET /api/interviews/:id`

Returns interview details, questions, and status.

### `POST /api/interviews/:id/answers`

Submits an answer for an interview question.

**Request Body**

```json
{
  "questionId": "uuid",
  "answer": "My approach to designing the API was..."
}
```

### `POST /api/interviews/:id/evaluate`

Generates the final interview evaluation.

---

## Readiness

### `GET /api/readiness`

Returns the user’s current readiness profile, skill evidence, and recommended next actions.
