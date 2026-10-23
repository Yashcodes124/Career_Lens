export type GapPriority = "high" | "medium" | "low";

export interface SkillGap {
  skill: string;
  priority: GapPriority;
  // Why this gap has its priority, e.g. "Named 3 times in the job description".
  evidence: string;
}

export interface MatchResult {
  status: "OK" | "INSUFFICIENT_DATA";
  // null when the posting lists no skills we can compare. Never a guessed number.
  score: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  skillGaps: SkillGap[];
}

export interface MatchResponseData extends MatchResult {
  applicationId: string;
}

export interface MatchResponse {
  success: boolean;
  data: MatchResponseData;
}
