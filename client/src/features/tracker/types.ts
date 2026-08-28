//client/src/features/tracker/types.ts

import type { Job } from "../jobs/types";

export type ApplicationStatus =
  "SAVED" | "APPLIED" | "INTERVIEWING" | "OFFER" | "REJECTED";

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  matchScore?: number | null;
  skillGaps: string[];
  tailoredText?: string | null;
  createdAt: string;
  updatedAt: string;
  job: Job;
}

export interface ApplicationsResponse {
  success: boolean;
  applications: Application[];
  message?: string;
}

export interface ApplicationResponse {
  success: boolean;
  application: Application;
  message?: string;
}
