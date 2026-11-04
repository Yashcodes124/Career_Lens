# Database Documentation

TrueHire uses PostgreSQL and Prisma ORM.

## Entity Relationship Overview

```text
User
 ├── Resume
 ├── SavedJob
 ├── Application
 ├── Interview
 └── UserSkill

Job
 ├── SavedJob
 └── Application

Application
 └── Interview

Interview
 ├── InterviewQuestion
 └── Evaluation
```

## Models

### User

Stores authentication and career-preference data.

| Field                | Type     | Description             |
| -------------------- | -------- | ----------------------- |
| `id`                 | UUID     | Primary key             |
| `email`              | String   | Unique email            |
| `passwordHash`       | String   | Hashed password         |
| `name`               | String   | User name               |
| `role`               | Enum     | `USER` or `ADMIN`       |
| `targetRole`         | String   | Desired role            |
| `preferredLocations` | String[] | Preferred job locations |
| `experienceLevel`    | String   | Experience level        |

### Resume

Stores uploaded and analyzed resumes.

| Field           | Type     | Description            |
| --------------- | -------- | ---------------------- |
| `id`            | UUID     | Primary key            |
| `userId`        | UUID     | Owner                  |
| `title`         | String   | Resume title           |
| `fileName`      | String   | Uploaded file name     |
| `filePath`      | String   | Stored file path       |
| `mimeType`      | String   | File MIME type         |
| `fileSize`      | Int      | File size              |
| `rawText`       | Text     | Extracted resume text  |
| `parsedData`    | JSON     | Structured AI analysis |
| `skills`        | String[] | Extracted skills       |
| `experienceYrs` | Int      | Estimated experience   |

### Job

Stores normalized external job listings.

| Field          | Type     | Description                                 |
| -------------- | -------- | ------------------------------------------- |
| `id`           | UUID     | Primary key                                 |
| `externalId`   | String   | Source-specific job ID                      |
| `source`       | String   | `GREENHOUSE`, `LEVER`, `ASHBY`, or `MANUAL` |
| `title`        | String   | Job title                                   |
| `company`      | String   | Company name                                |
| `location`     | String   | Job location                                |
| `description`  | Text     | Job description                             |
| `requirements` | String[] | Extracted requirements                      |
| `salaryRange`  | String   | Salary information                          |
| `url`          | String   | Original job URL                            |
| `isActive`     | Boolean  | Whether the job is currently active         |

### SavedJob

Stores jobs saved by users.

### Application

Tracks a user’s application workflow.

| Field          | Type     | Description                                             |
| -------------- | -------- | ------------------------------------------------------- |
| `status`       | Enum     | `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, `REJECTED` |
| `matchScore`   | Float    | Resume-job match score                                  |
| `skillGaps`    | String[] | Identified gaps                                         |
| `tailoredText` | Text     | Tailored application content                            |

### Interview

Stores interview sessions.

| Field        | Type | Description                                          |
| ------------ | ---- | ---------------------------------------------------- |
| `status`     | Enum | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `plan`       | JSON | Interview plan                                       |
| `transcript` | JSON | Interview transcript                                 |

### InterviewQuestion

Stores generated questions, answers, feedback, and scores.

### Evaluation

Stores final interview evaluation results.

### UserSkill

Stores the persistent skill profile.

| Field      | Type   | Description                       |
| ---------- | ------ | --------------------------------- |
| `skill`    | String | Skill name                        |
| `status`   | Enum   | `STRONG` or `WEAK`                |
| `evidence` | String | Evidence from resume or interview |

## Migrations

Run migrations:

```bash
cd server
npx prisma migrate dev
```

Apply migrations in production:

```bash
npx prisma migrate deploy
```

Open Prisma Studio:

```bash
npx prisma studio
```
