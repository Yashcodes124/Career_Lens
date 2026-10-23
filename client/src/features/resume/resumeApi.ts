import { apiClient } from "../../lib/api-client";
import type { ResumeSummary } from "./types";

interface ResumesResponse {
  success: boolean;
  resumes: ResumeSummary[];
}

interface ResumeResponse {
  success: boolean;
  resume: ResumeSummary;
}

// Newest first, as the server returns them.
export async function fetchResumes(): Promise<ResumeSummary[]> {
  const response = await apiClient<ResumesResponse>("/resumes", { method: "GET" });
  return response.resumes ?? [];
}

export async function uploadResume(file: File): Promise<ResumeSummary> {
  const body = new FormData();
  body.append("resume", file);

  const response = await apiClient<ResumeResponse>("/resumes", {
    method: "POST",
    body,
  });
  return response.resume;
}

export async function deleteResume(id: string): Promise<void> {
  await apiClient(`/resumes/${id}`, { method: "DELETE" });
}
