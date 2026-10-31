import { apiClient } from "../../lib/api-client";
import type { Job, JobResponse, JobsResponse } from "./types";

export async function fetchJobs(): Promise<Job[]> {
  const response = await apiClient<JobsResponse>("/jobs?pageSize=100", {
    method: "GET",
  });

  return response.jobs ?? [];
}

export async function fetchJobById(id: string): Promise<Job> {
  const response = await apiClient<JobResponse>(`/jobs/${id}`, {
    method: "GET",
  });

  return response.job;
}

export async function saveJob(id: string) {
  return await apiClient(`/jobs/${id}/save`, { method: "POST" });
}

export async function unsaveJob(id: string) {
  return await apiClient(`/jobs/${id}/save`, { method: "DELETE" });
}

export async function fetchSavedJobs(): Promise<Job[]> {
  const response = await apiClient<JobsResponse>("/jobs/saved", {
    method: "GET",
  });

  return response.jobs ?? [];
}

export async function syncVerifiedJobs(boardToken?: string, company?: string) {
  return await apiClient<{
    success: boolean;
    totalFetched: number;
    totalSaved: number;
    totalDeactivated: number;
  }>("/jobs/sync", {
    method: "POST",
    body: JSON.stringify({ boardToken, company }),
  });
}

export interface ExternalJobPayload {
  title: string;
  company: string;
  location?: string;
  source?: string;
  url?: string;
  salaryRange?: string;
  description: string;
}

export async function importExternalJob(
  payload: ExternalJobPayload,
): Promise<Job> {
  const response = await apiClient<{ success: boolean; job: Job; data: Job }>(
    "/jobs/external",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return response.job ?? response.data;
}
