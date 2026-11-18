import type { JobSource, Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

export type TrackedFeatureEvent =
  | "resume_uploaded"
  | "resume_parse_failed"
  | "resume_reanalyzed"
  | "match_generated"
  | "skill_gap_opened"
  | "interview_created"
  | "interview_completed"
  | "evaluation_generated"
  | "skill_proof_submitted"
  | "bullet_suggestion_accepted"
  | "bullet_suggestion_rejected"
  | "radar_viewed"
  | "simulator_used";

export const ALLOWED_CLIENT_EVENTS = new Set<TrackedFeatureEvent>([
  "skill_gap_opened",
  "bullet_suggestion_accepted",
  "bullet_suggestion_rejected",
  "radar_viewed",
  "simulator_used",
]);

export interface JobSyncAuditInput {
  source: JobSource;
  boardToken?: string | null;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  jobsFetched: number;
  jobsCreated: number;
  jobsUpdated: number;
  jobsDeactivated: number;
  duplicatesFound: number;
  durationMs: number;
  errorMessage?: string | null;
}

export const recordJobSyncAudit = (input: JobSyncAuditInput): void => {
  if (
    process.env.NODE_ENV === "test" &&
    process.env.TELEMETRY_TEST !== "true"
  ) {
    return;
  }
  if (!prisma?.jobSyncAudit?.create) return;

  void prisma.jobSyncAudit
    .create({
      data: {
        source: input.source,
        boardToken: input.boardToken ?? null,
        status: input.status,
        jobsFetched: input.jobsFetched,
        jobsCreated: input.jobsCreated,
        jobsUpdated: input.jobsUpdated,
        jobsDeactivated: input.jobsDeactivated,
        duplicatesFound: input.duplicatesFound,
        durationMs: Math.max(0, Math.round(input.durationMs)),
        errorMessage: input.errorMessage
          ? input.errorMessage.slice(0, 300)
          : null,
      },
    })
    .catch(() => null);
};

export interface ResumeParseAuditInput {
  userId?: string | null;
  resumeId?: string | null;
  mimeType?: string | null;
  status: "SUCCESS" | "FAILED" | "LOW_QUALITY";
  qualityScore?: number | null;
  textLength: number;
  warnings?: unknown;
  durationMs: number;
}

export const recordResumeParseAudit = (input: ResumeParseAuditInput): void => {
  if (
    process.env.NODE_ENV === "test" &&
    process.env.TELEMETRY_TEST !== "true"
  ) {
    return;
  }
  if (!prisma?.resumeParseAudit?.create) return;

  void prisma.resumeParseAudit
    .create({
      data: {
        userId: input.userId ?? null,
        resumeId: input.resumeId ?? null,
        mimeType: input.mimeType ?? null,
        status: input.status,
        qualityScore: input.qualityScore ?? null,
        textLength: Math.max(0, Math.round(input.textLength)),
        warnings: (input.warnings ?? null) as Prisma.InputJsonValue,
        durationMs: Math.max(0, Math.round(input.durationMs)),
      },
    })
    .catch(() => null);
};

export const recordFeatureEvent = (params: {
  userId?: string | null;
  event: TrackedFeatureEvent;
  metadata?: Record<string, unknown>;
}): void => {
  if (
    process.env.NODE_ENV === "test" &&
    process.env.TELEMETRY_TEST !== "true"
  ) {
    return;
  }
  if (!prisma?.featureUsageEvent?.create) return;

  void prisma.featureUsageEvent
    .create({
      data: {
        userId: params.userId ?? null,
        event: params.event,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
      },
    })
    .catch(() => null);
};
