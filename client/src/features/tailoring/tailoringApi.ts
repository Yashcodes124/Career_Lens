import { apiClient } from "../../lib/api-client";

export interface AddSuggestion {
  skill: string;
  evidence: string;
}

export interface MissingSuggestion {
  skill: string;
  priority: "high" | "medium" | "low";
  evidence: string;
}

export interface TailoringSuggestions {
  jobTitle: string;
  currentSkills: string[];
  addToSkills: AddSuggestion[];
  notOnResume: MissingSuggestion[];
  suggestedSkills: string[];
}

export async function fetchTailoring(resumeId: string, jobId: string): Promise<TailoringSuggestions> {
  const response = await apiClient<{ success: boolean; data: TailoringSuggestions }>(
    `/resumes/${resumeId}/tailoring`,
    { method: "POST", body: JSON.stringify({ jobId }) },
  );
  return response.data;
}
