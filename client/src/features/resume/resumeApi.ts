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
  const response = await apiClient<ResumesResponse>("/resumes", {
    method: "GET",
  });
  return response.resumes ?? [];
}
export async function fetchResumeById(id: string): Promise<ResumeSummary> {
  const response = await apiClient<ResumeResponse>(`/resumes/${id}`, {
    method: "GET",
  });
  return response.resume;
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

export async function pasteResume(payload: {
  title?: string;
  rawText: string;
}): Promise<ResumeSummary> {
  const response = await apiClient<ResumeResponse>("/resumes/paste", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.resume;
}

export async function reanalyzeResume(
  id: string,
  rawText?: string,
): Promise<ResumeSummary> {
  const response = await apiClient<ResumeResponse>(`/resumes/${id}/reanalyze`, {
    method: "POST",
    body: JSON.stringify(rawText ? { rawText } : {}),
  });
  return response.resume;
}

export interface UpdateResumeSectionsPayload {
  title?: string;
  summary?: string;
  skills?: string[];
  totalExperienceYears?: number;
  experience?: import("./types").ParsedExperience[];
  projects?: import("./types").ParsedProject[];
  education?: import("./types").ParsedEducation[];
}

export async function updateResumeSections(
  id: string,
  payload: UpdateResumeSectionsPayload,
): Promise<ResumeSummary> {
  const response = await apiClient<ResumeResponse>(`/resumes/${id}/sections`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.resume;
}
