# Resume builder feature

Backend

Create:

server/src/
├── controllers/
│ └── resumeController.ts
├── routes/
│ └── resume.ts
├── services/
│ └── resumeService.ts
├── repositories/
│ └── resumeRepository.ts
├── validators/
│ └── resumeValidator.ts
└── utils/
└── file/

And register:

/api/resumes
First endpoints
POST /api/resumes
GET /api/resumes
GET /api/resumes/:id
DELETE /api/resumes/:id

But initially:

POST only needs to prove that the authenticated user can upload a valid file.

Don't implement AI yet.

File requirements

V1:

PDF
DOCX

Reject:

.exe
.zip
.png
.jpg
.mp4
etc.

Also enforce:

maximum file size
MIME/type validation
authenticated user ownership

FrontEnd:
┌──────────────────────────────────────┐
│ Resume │
│ Upload your latest resume │
│ │
│ ┌──────────────────────────────────┐ │
│ │ Drag & Drop Resume │ │
│ │ │ │
│ │ PDF or DOCX │ │
│ │ │ │
│ │ [ Choose File ] │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘

client/src/features/resume/
├── ResumePage.tsx
├── ResumeUpload.tsx
├── ResumeList.tsx
├── ResumeCard.tsx
├── resumeApi.ts
└── types.ts
