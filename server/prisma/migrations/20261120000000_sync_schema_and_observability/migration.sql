-- Idempotent reconciliation migration aligning database schema with prisma/schema.prisma
-- Covers JobSource enum, users.refreshTokenHash, interview_questions.feedback JSONB,
-- and observability/ontology tables (ontology_aliases, ai_request_audits, job_sync_audits,
-- resume_parse_audits, feature_usage_events).

-- 1. Create JobSource enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JobSource') THEN
    CREATE TYPE "JobSource" AS ENUM ('GREENHOUSE', 'LEVER', 'ASHBY', 'MANUAL', 'LINKEDIN');
  END IF;
END $$;

-- 2. Normalize jobs.source to JobSource enum if currently TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs'
      AND column_name = 'source'
      AND udt_name <> 'JobSource'
  ) THEN
    ALTER TABLE "jobs" ALTER COLUMN "source" DROP DEFAULT;
    ALTER TABLE "jobs"
      ALTER COLUMN "source" TYPE "JobSource"
      USING (
        CASE UPPER("source")
          WHEN 'GREENHOUSE' THEN 'GREENHOUSE'::"JobSource"
          WHEN 'LEVER' THEN 'LEVER'::"JobSource"
          WHEN 'ASHBY' THEN 'ASHBY'::"JobSource"
          WHEN 'MANUAL' THEN 'MANUAL'::"JobSource"
          WHEN 'LINKEDIN' THEN 'LINKEDIN'::"JobSource"
          ELSE 'GREENHOUSE'::"JobSource"
        END
      );
    ALTER TABLE "jobs" ALTER COLUMN "source" SET DEFAULT 'GREENHOUSE'::"JobSource";
  END IF;
END $$;

-- 3. Add refreshTokenHash to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "refreshTokenHash" TEXT;

-- 4. Convert interview_questions.feedback from TEXT to JSONB safely if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'interview_questions'
      AND column_name = 'feedback'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "interview_questions"
      ALTER COLUMN "feedback" TYPE JSONB
      USING (
        CASE
          WHEN "feedback" IS NULL THEN NULL
          WHEN LEFT(BTRIM("feedback"), 1) IN ('{', '[') THEN "feedback"::jsonb
          ELSE to_jsonb("feedback")
        END
      );
  END IF;
END $$;

-- 5. Add missing indexes on core tables
CREATE INDEX IF NOT EXISTS "resumes_userId_createdAt_idx" ON "resumes"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "jobs_isActive_source_idx" ON "jobs"("isActive", "source");
CREATE INDEX IF NOT EXISTS "jobs_company_idx" ON "jobs"("company");
CREATE INDEX IF NOT EXISTS "interviews_userId_idx" ON "interviews"("userId");
CREATE INDEX IF NOT EXISTS "interviews_applicationId_idx" ON "interviews"("applicationId");

-- 6. Create ontology_aliases
CREATE TABLE IF NOT EXISTS "ontology_aliases" (
  "id" TEXT NOT NULL,
  "rawSkill" TEXT NOT NULL,
  "canonicalSkill" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ontology_aliases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ontology_aliases_rawSkill_canonicalSkill_key"
  ON "ontology_aliases"("rawSkill", "canonicalSkill");
CREATE INDEX IF NOT EXISTS "ontology_aliases_status_idx"
  ON "ontology_aliases"("status");

-- 7. Create ai_request_audits
CREATE TABLE IF NOT EXISTS "ai_request_audits" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "feature" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "costUsd" DOUBLE PRECISION,
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_request_audits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ai_request_audits_userId_createdAt_idx"
  ON "ai_request_audits"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_request_audits_feature_createdAt_idx"
  ON "ai_request_audits"("feature", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_request_audits_status_createdAt_idx"
  ON "ai_request_audits"("status", "createdAt");

-- 8. Create job_sync_audits
CREATE TABLE IF NOT EXISTS "job_sync_audits" (
  "id" TEXT NOT NULL,
  "source" "JobSource" NOT NULL,
  "boardToken" TEXT,
  "status" TEXT NOT NULL,
  "jobsFetched" INTEGER NOT NULL,
  "jobsCreated" INTEGER NOT NULL,
  "jobsUpdated" INTEGER NOT NULL,
  "jobsDeactivated" INTEGER NOT NULL,
  "duplicatesFound" INTEGER NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_sync_audits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "job_sync_audits_source_createdAt_idx"
  ON "job_sync_audits"("source", "createdAt");

-- 9. Create resume_parse_audits
CREATE TABLE IF NOT EXISTS "resume_parse_audits" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "resumeId" TEXT,
  "mimeType" TEXT,
  "status" TEXT NOT NULL,
  "qualityScore" INTEGER,
  "textLength" INTEGER NOT NULL,
  "warnings" JSONB,
  "durationMs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "resume_parse_audits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "resume_parse_audits_status_createdAt_idx"
  ON "resume_parse_audits"("status", "createdAt");

-- 10. Create feature_usage_events
CREATE TABLE IF NOT EXISTS "feature_usage_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "event" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feature_usage_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "feature_usage_events_event_createdAt_idx"
  ON "feature_usage_events"("event", "createdAt");
CREATE INDEX IF NOT EXISTS "feature_usage_events_userId_createdAt_idx"
  ON "feature_usage_events"("userId", "createdAt");
