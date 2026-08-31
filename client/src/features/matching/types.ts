export interface SkillGap {
  skill: string;
  priority: "high" | "medium" | "low";
}

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  skillGaps: SkillGap[];
}

export interface MatchResponse {
  success: boolean;
  data: MatchResult;
}
