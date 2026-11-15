export type JobFreshnessState = "ACTIVE" | "POSSIBLY_STALE" | "CLOSED";

export interface SyncHealth {
  status: "HEALTHY" | "DEGRADED";
  lastSuccessfulSyncAt: string | null;
  totalFetched: number;
  totalSaved: number;
  totalDeactivated: number;
  duplicatesRemoved?: number;
  sourcesChecked?: string[];
}

export interface Job {
  id: string;
  externalId?: string | null;
  source: string;
  title: string;
  company: string;
  location: string | null;
  description: string;
  requirements: string[];
  salaryRange: string | null;
  url?: string | null;
  isActive: boolean;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
  duplicateSources?: string[];
}

export interface JobsResponse {
  success: boolean;
  jobs: Job[];
  total?: number;
  syncHealth?: SyncHealth;
  message?: string;
}
export interface JobResponse {
  success: boolean;
  job: Job;
  message?: string;
}
