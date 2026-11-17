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

export interface BulletCoachSuggestion {
  id: string;
  section: "Experience" | "Projects" | "Summary";
  originalBullet: string;
  suggestedBullet: string;
  vaguePhrasesDetected: string[];
  actionVerbUpgrade: { from: string; to: string } | null;
  hasExistingMetric: boolean;
  needsUserMetric: boolean;
  metricPrompt: string | null;
  matchedJobSkillsInBullet: string[];
  verifiedSkillsInBullet: string[];
  rationale: string;
}

export interface TailoringSuggestions {
  jobTitle: string;
  currentSkills: string[];
  addToSkills: AddSuggestion[];
  notOnResume: MissingSuggestion[];
  suggestedSkills: string[];
  bulletSuggestions: BulletCoachSuggestion[];
}

export async function fetchTailoring(
  resumeId: string,
  jobId: string,
): Promise<TailoringSuggestions> {
  const res = await apiClient.post<{
    success: boolean;
    data: TailoringSuggestions;
  }>(`/resumes/${resumeId}/tailoring`, { jobId });
  return res.data;
}

export async function applyTailoredResume(params: {
  resumeId: string;
  acceptedSkills: string[];
  acceptedBullets: Array<{ originalBullet: string; finalBullet: string }>;
}) {
  const res = await apiClient.post<{
    success: boolean;
    data: { appliedBulletsCount: number; totalSkillsCount: number };
  }>(`/resumes/${params.resumeId}/tailoring/apply`, {
    acceptedSkills: params.acceptedSkills,
    acceptedBullets: params.acceptedBullets,
  });
  return res.data;
}
