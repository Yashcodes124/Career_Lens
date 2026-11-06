export type GapPriority = "high" | "medium" | "low";

export interface SkillGap {
  skill: string;
  priority: GapPriority;
  // Why this gap has its priority, e.g. "Named 3 times in the job description".
  evidence: string;
}
export type DefenseStatus =
  "FORTIFIED" | "UNVERIFIED_CLAIM" | "EXPOSED_WEAKNESS";

export interface DefenseSkillAudit {
  skill: string;
  status: DefenseStatus;
  note: string;
}

export interface OffenseStrikeTarget {
  skill: string;
  priority: GapPriority;
  scoreGainPct: number;
  ProjectedScore: number;
  rationale: string;
}

export interface TacticalMatrix {
  defense: {
    defensibilityScore: number;
    posture: "FORTIFIED" | "EXPOSED" | "UNPROVEN";
    fortifiedSkills: string[];
    unverifiedClaims: string[];
    exposedWeaknesses: string[];
    auditTrail: DefenseSkillAudit[];
  };
  offense: {
    singleSkillGainPct: number;
    projectedScoreAfterTop3: number;
    strikeTargets: OffenseStrikeTarget[];
  };
}

export interface MatchResult {
  status: "OK" | "INSUFFICIENT_DATA";
  // null when the posting lists no skills we can compare. Never a guessed number.
  score: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  skillGaps: SkillGap[];
  tactical?: TacticalMatrix | null;
}

export interface MatchResponseData extends MatchResult {
  applicationId: string;
}

export interface MatchResponse {
  success: boolean;
  data: MatchResponseData;
}
