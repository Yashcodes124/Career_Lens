import { apiClient } from "../../lib/api-client";

export type NextAction =
  | { type: "UPLOAD_RESUME"; reason: string }
  | { type: "PRACTICE_SKILL"; skill: string; reason: string }
  | { type: "EXPLORE_JOBS"; reason: string }
  | { type: "START_INTERVIEW"; reason: string };

export interface ReadinessSkill {
  skill: string;
  status: "STRONG" | "WEAK";
  evidence: string;
  updatedAt: string;
}

export interface GlobalDefenseSummary {
  fortifiedCount: number;
  unverifiedCount: number;
  exposedCount: number;
  defensibilityPct: number;
  unverifiedSkills: string[];
}

export interface GlobalOffenseTarget {
  skill: string;
  blockedApplicationsCount: number;
  isExposedWeakness: boolean;
}

export interface ReadinessData {
  skills: ReadinessSkill[];
  nextAction: NextAction;
  defenseSummary?: GlobalDefenseSummary;
  offenseTargets?: GlobalOffenseTarget[];
}
interface ReadinessEnvelope {
  success?: boolean;
  status?: string;
  data: ReadinessData;
}

export async function fetchReadinessApi(): Promise<ReadinessData> {
  const res = await apiClient.get<ReadinessEnvelope | ReadinessData>(
    "/readiness",
  );
  if ("data" in res && res.data) {
    return res.data;
  }
  return res as ReadinessData;
}

export const fetchReadiness = fetchReadinessApi;
