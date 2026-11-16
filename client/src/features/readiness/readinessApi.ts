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

export interface SkillInterviewHistoryItem {
  interviewId: string;
  interviewTitle: string;
  round: string;
  questionOrder: number;
  score: number | null;
  status: "STRONG" | "WEAK";
  feedback: string;
  date: string;
}

export interface MatchImprovementPotential {
  currentAvgMatchPct: number;
  projectedAvgMatchPct: number;
  potentialGainPct: number;
  trackedJobsCount: number;
  topUnlockSkill: string | null;
}

export interface ReadinessData {
  skills: ReadinessSkill[];
  nextAction: NextAction;
  defenseSummary?: GlobalDefenseSummary;
  offenseTargets?: GlobalOffenseTarget[];
  interviewHistoryBySkill?: Record<string, SkillInterviewHistoryItem[]>;
  matchImprovement?: MatchImprovementPotential;
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

export type SkillProofType =
  "GITHUB_LINK" | "PROJECT_DESCRIPTION" | "CERTIFICATION" | "RESUME_BULLET";

export interface SubmitSkillProofPayload {
  skill: string;
  proofType: SkillProofType;
  title?: string;
  url?: string;
  description: string;
  jobId?: string;
  resumeId?: string;
  syncToResume?: boolean;
}

export interface SubmitSkillProofResponse {
  skillRecord: ReadinessSkill;
  readiness: ReadinessData;
  updatedMatch: import("../matching/types").MatchResult | null;
}

export async function submitSkillProof(
  payload: SubmitSkillProofPayload,
): Promise<SubmitSkillProofResponse> {
  const res = await apiClient.post<{
    success: boolean;
    data: SubmitSkillProofResponse;
  }>("/readiness/proof", payload);
  return res.data;
}

export const fetchReadiness = fetchReadinessApi;
