import { apiClient } from "@/lib/api-client";

import {
  Application,
  ApplicationsResponse,
  ApplicationResponse,
  ApplicationStatus,
} from "./types";

export async function fetchApplications(): Promise<Application[]> {
  const response = await apiClient<ApplicationsResponse>("/applications", {
    method: "GET",
  });
  return response.applications ?? [];
}
export async function fetchApplicationById(id: string): Promise<Application> {
  const response = await apiClient<ApplicationResponse>(`/applications/${id}`, {
    method: "GET",
  });
  return response.application;
}
export async function createApplication(jobId: string): Promise<Application> {
  const response = await apiClient<ApplicationResponse>(
    `/applications/job/${jobId}`,
    {
      method: "POST",
    },
  );
  return response.application;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<Application> {
  const response = await apiClient<ApplicationResponse>(
    `/applications/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
  return response.application;
}
