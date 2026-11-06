// Deterministic resume-to-job matching + Offense & Defense Tactical Matrix.
// Every number can be traced to a skill name, a count of mentions in the job description,
// or an interview report. No model is involved.
import { normalizeSkills } from "./skillNormalizer";
import { countSkillMentions } from "./skillDictionary";

export type GapPriority = "high" | "medium" | "low";

export interface SkillGap {
  skill: string;
  priority: GapPriority;
  evidence: string;
}

export interface MatchResult {
  status: "OK" | "INSUFFICIENT_DATA";
  score: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  skillGaps: SkillGap[];
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
    defensibilityScore: number; // 0-100%: how much of your matched profile is interview-verified
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

// Interview evidence from earlier mock interviews. It changes what the candidate is credited with.
export interface InterviewEvidence {
  strongSkills: string[];
  weakSkills: Map<string, string>; // skill -> evidence text
}

const PRIORITY_ORDER: Record<GapPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// A skill named three or more times in the posting is core to the role.
const priorityFromMentions = (mentions: number): GapPriority => {
  if (mentions >= 3) return "high";
  if (mentions === 2) return "medium";
  return "low";
};

const normalizeInterviewEvidence = (interview?: InterviewEvidence) => {
  const normalizedStrong = new Set(
    normalizeSkills(interview?.strongSkills ?? []),
  );
  const normalizedWeak = new Map<string, string>();

  if (interview?.weakSkills) {
    for (const [rawSkill, evidence] of interview.weakSkills.entries()) {
      const [norm] = normalizeSkills([rawSkill]);
      const key = norm ?? rawSkill.toLowerCase().trim();
      if (key) {
        normalizedWeak.set(key, evidence);
        normalizedStrong.delete(key);
      }
    }
  }

  return { normalizedStrong, normalizedWeak };
};

export const calculateMatch = (
  resumeSkills: string[],
  jobSkills: string[],
  jobDescription?: string,
  interview?: InterviewEvidence,
): MatchResult => {
  const requiredSkills = normalizeSkills(jobSkills);

  if (requiredSkills.length === 0) {
    return {
      status: "INSUFFICIENT_DATA",
      score: null,
      matchedSkills: [],
      missingSkills: [],
      skillGaps: [],
    };
  }

  const { normalizedStrong, normalizedWeak } =
    normalizeInterviewEvidence(interview);

  // Credit comes from the resume and from strong interview evidence.
  // A skill flagged as weak in an interview is not credited, even if the resume lists it.
  const candidateSkills = new Set(normalizeSkills(resumeSkills));
  for (const skill of normalizedStrong) candidateSkills.add(skill);
  for (const skill of normalizedWeak.keys()) candidateSkills.delete(skill);

  const matchedSkills = requiredSkills.filter((skill) =>
    candidateSkills.has(skill),
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !candidateSkills.has(skill),
  );

  const mentions = jobDescription ? countSkillMentions(jobDescription) : null;

  const skillGaps: SkillGap[] = missingSkills
    .map((skill) => {
      if (normalizedWeak.has(skill)) {
        return {
          skill,
          priority: "high" as const,
          evidence:
            "Weak in a mock interview. Practise it before the next interview.",
        };
      }
      const count = mentions?.get(skill) ?? 0;
      const priority: GapPriority = mentions
        ? priorityFromMentions(count)
        : "medium";
      const evidence =
        count > 0
          ? `Named ${count} ${count === 1 ? "time" : "times"} in the job description`
          : "Listed in the job requirements";
      return { skill, priority, evidence };
    })
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        a.skill.localeCompare(b.skill),
    );

  return {
    status: "OK",
    score: Math.round((matchedSkills.length / requiredSkills.length) * 100),
    matchedSkills,
    missingSkills,
    skillGaps,
  };
};

export const calculateTacticalMatrix = (
  resumeSkills: string[],
  jobSkills: string[],
  jobDescription?: string,
  interview?: InterviewEvidence,
): TacticalMatrix | null => {
  const match = calculateMatch(
    resumeSkills,
    jobSkills,
    jobDescription,
    interview,
  );
  if (match.status !== "OK" || match.score === null) {
    return null;
  }

  const requiredSkills = normalizeSkills(jobSkills);
  const parsedResumeSkills = new Set(normalizeSkills(resumeSkills));
  const { normalizedStrong, normalizedWeak } =
    normalizeInterviewEvidence(interview);

  const fortifiedSkills: string[] = [];
  const unverifiedClaims: string[] = [];
  const exposedWeaknesses: string[] = [];
  const auditTrail: DefenseSkillAudit[] = [];

  for (const skill of requiredSkills) {
    if (normalizedWeak.has(skill)) {
      exposedWeaknesses.push(skill);
      auditTrail.push({
        skill,
        status: "EXPOSED_WEAKNESS",
        note: parsedResumeSkills.has(skill)
          ? "Claimed on resume but flagged weak in mock interview interrogation."
          : "Required by role and flagged weak in mock interview.",
      });
    } else if (normalizedStrong.has(skill)) {
      fortifiedSkills.push(skill);
      auditTrail.push({
        skill,
        status: "FORTIFIED",
        note: "Verified strong under rubric-graded mock interview interrogation.",
      });
    } else if (parsedResumeSkills.has(skill)) {
      unverifiedClaims.push(skill);
      auditTrail.push({
        skill,
        status: "UNVERIFIED_CLAIM",
        note: "Listed on resume with zero mock interview verification.",
      });
    }
  }

  const totalDefensiveClaims =
    fortifiedSkills.length + unverifiedClaims.length + exposedWeaknesses.length;

  // Fortified = 100% weight, Unverified = 50% weight (unproven), Exposed = 0% weight
  const defensibilityScore =
    totalDefensiveClaims > 0
      ? Math.round(
          ((fortifiedSkills.length * 1.0 + unverifiedClaims.length * 0.5) /
            totalDefensiveClaims) *
            100,
        )
      : 0;

  const posture: "FORTIFIED" | "EXPOSED" | "UNPROVEN" =
    exposedWeaknesses.length > 0
      ? "EXPOSED"
      : fortifiedSkills.length > 0 &&
          fortifiedSkills.length >= unverifiedClaims.length
        ? "FORTIFIED"
        : "UNPROVEN";

  const singleSkillGainPct =
    requiredSkills.length > 0
      ? Math.round((1 / requiredSkills.length) * 100)
      : 0;

  const strikeTargets: OffenseStrikeTarget[] = match.skillGaps
    .slice(0, 5)
    .map((gap, index) => {
      const cumulativeMatched = Math.min(
        requiredSkills.length,
        match.matchedSkills.length + (index + 1),
      );
      const projectedScore = Math.round(
        (cumulativeMatched / requiredSkills.length) * 100,
      );
      return {
        skill: gap.skill,
        priority: gap.priority,
        scoreGainPct: singleSkillGainPct,
        ProjectedScore: projectedScore,
        rationale: normalizedWeak.has(gap.skill)
          ? `Reclaim +${singleSkillGainPct}% match credit lost to earlier interview weakness.`
          : `Capture +${singleSkillGainPct}% match credit (${gap.evidence}).`,
      };
    });

  const top3Matched = Math.min(
    requiredSkills.length,
    match.matchedSkills.length + Math.min(3, match.skillGaps.length),
  );
  const projectedScoreAfterTop3 = Math.round(
    (top3Matched / requiredSkills.length) * 100,
  );

  return {
    defense: {
      defensibilityScore,
      posture,
      fortifiedSkills,
      unverifiedClaims,
      exposedWeaknesses,
      auditTrail,
    },
    offense: {
      singleSkillGainPct,
      projectedScoreAfterTop3,
      strikeTargets,
    },
  };
};
