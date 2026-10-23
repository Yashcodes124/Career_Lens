import { apiClient } from "../../lib/api-client";

export type NextAction =
  | { type: "UPLOAD_RESUME"; reason: string }
  | { type: "PRACTICE_SKILL"; skill: string; reason: string }
  | { type: "EXPLORE_JOBS"; reason: string }
  | { type: "START_INTERVIEW"; reason: string };

export interface SkillState {
  skill: string;
  status: "STRONG" | "WEAK";
  evidence: string;
  updatedAt: string;
}

export interface ReadinessData {
  skills: SkillState[];
  nextAction: NextAction;
}

export async function fetchReadinessApi(): Promise<ReadinessData> {
  const response = await apiClient<{ success: boolean; data: ReadinessData }>("/readiness", {
    method: "GET",
  });
  return response.data;
}
