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

export type SkillConfidence =
  | "EXACT_MATCH"
  | "ALIAS_MATCH"
  | "PARTIAL_MATCH"
  | "INFERRED_MATCH"
  | "MISSING";

export type SkillVerificationState =
  "VERIFIED_STRONG" | "WEAK" | "UNVERIFIED" | "MISSING";

export interface SkillEvidenceAuditItem {
  skill: string;
  verificationState: SkillVerificationState;
  confidence: SkillConfidence;
  impactPct: number;
  credited: boolean;
  priority: GapPriority;
  resumeEvidence: {
    found: boolean;
    section: string | null;
    matchedTerm: string | null;
    snippet: string | null;
  };
  jobEvidence: {
    mentionCount: number;
    summary: string;
    snippet: string | null;
  };
  interviewEvidence: {
    status: "STRONG" | "WEAK" | "UNVERIFIED" | "MISSING";
    citation: string | null;
    summary: string;
  };
  recommendedAction: string;
}
export interface ScoreDecomposition {
  headlineScores: {
    matchScore: { score: number; question: string; summary: string };
    readinessScore: { score: number; question: string; summary: string };
    preparationScore: { score: number; question: string; summary: string };
  };
  factors: {
    requiredSkillCoverage: {
      score: number;
      met: number;
      total: number;
      detail: string;
    };
    preferredSkillCoverage: {
      score: number;
      met: number;
      total: number;
      detail: string;
    };
    interviewVerifiedCoverage: {
      score: number;
      verified: number;
      total: number;
      detail: string;
    };
    resumeEvidenceQuality: {
      score: number;
      contextualCount: number;
      totalMatched: number;
      detail: string;
    };
    experienceAlignment: {
      score: number;
      candidateYears: number | null;
      requiredYears: number | null;
      detail: string;
    };
    criticalGapPenalty: {
      penaltyPct: number;
      criticalGaps: number;
      weakSkills: number;
      detail: string;
    };
    jobDescriptionConfidence: {
      score: number;
      level: "HIGH" | "MEDIUM" | "LOW";
      extractedSkillCount: number;
      detail: string;
    };
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
  skillAudit?: SkillEvidenceAuditItem[];
  scoreDecomposition?: ScoreDecomposition | null;
}

export interface MatchResponseData extends MatchResult {
  applicationId: string;
}

export interface MatchResponse {
  success: boolean;
  data: MatchResponseData;
}
