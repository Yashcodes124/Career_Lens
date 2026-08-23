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
}

export interface JobsResponse {
  success: boolean;
  jobs: Job[];
  message?: string;
}

export interface JobResponse {
  success: boolean;
  job: Job;
  message?: string;
}
