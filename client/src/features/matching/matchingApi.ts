// client / src / features / matching / matchingApi.ts;

import { MatchResponse } from "./types";
import { apiClient } from "@/lib/api-client";

interface MatchRequest {
  resumeId: string;
  jobId: string;
}

export interface SimulatedMatchImpact {
  disclaimer: string;
  selectedSkills: string[];
  maxSelectableSkills: number;
  baselineScore: number;
  projectedScore: number;
  scoreDeltaPct: number;
  baselineReadinessScore: number;
  projectedReadinessScore: number;
  readinessDeltaPct: number;
  requiredCoverage: {
    beforePct: number;
    afterPct: number;
    metBefore: number;
    metAfter: number;
    total: number;
  };
  preferredCoverage: {
    beforePct: number;
    afterPct: number;
    metBefore: number;
    metAfter: number;
    total: number;
  };
  resolvedPrerequisiteAlerts: string[];
  skillStateTransitions: Array<{
    skill: string;
    beforeStatus: string;
    afterStatus: "SIMULATED_VERIFIED" | "ALREADY_VERIFIED";
    impactPct: number;
  }>;
  affectedActiveJobsCount: number;
}

export const simulateJobMatch = async (data: {
  resumeId: string;
  jobId: string;
  selectedSkills: string[];
}): Promise<SimulatedMatchImpact> => {
  const response = await apiClient<{
    success: boolean;
    data: SimulatedMatchImpact;
  }>("/matches/simulate", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data;
};

export const calculateJobMatch = async (
  data: MatchRequest,
): Promise<MatchResponse> => {
  const response = await apiClient<MatchResponse>("/matches", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return response;
};
