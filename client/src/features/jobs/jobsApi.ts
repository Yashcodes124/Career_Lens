import { apiClient } from "../../lib/api-client";
import type { Job, JobResponse, JobsResponse } from "./types";

export async function fetchJobs(): Promise<Job[]> {
  const response = await apiClient<JobsResponse>("/jobs", {
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
