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
