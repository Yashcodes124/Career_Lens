// Turns any skill string into its canonical form, e.g. "  ReactJS " -> "react".
// Skills outside the dictionary keep their cleaned lowercase form and are logged to the review queue.
import {
  ALIAS_TO_CANONICAL,
  CANONICAL_SKILL_MAP,
  recordUnrecognizedSkillToken,
} from "./skillDictionary";

export const normalizeSkill = (
  skill: string,
  source?: string,
  context?: string,
): string => {
  const cleaned = skill
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\s,;:]+$/g, "")
    .trim();

  if (!cleaned) return "";

  const mapped = ALIAS_TO_CANONICAL.get(cleaned);
  if (mapped) return mapped;

  if (source) {
    recordUnrecognizedSkillToken(cleaned, source, context);
  }
  return cleaned;
};

export const normalizeSkills = (
  skills: string[],
  source?: string,
  context?: string,
): string[] => {
  const unique = new Set<string>();
  for (const skill of skills) {
    const normalized = normalizeSkill(skill, source, context);
    if (normalized) unique.add(normalized);
  }
  return [...unique];
};

export type SeniorityBand = "JUNIOR" | "MID" | "SENIOR" | "STAFF_PRINCIPAL";

export interface SenioritySkillAssessment {
  targetSeniority: SeniorityBand;
  candidateSeniority: SeniorityBand;
  seniorityAligned: boolean;
  advancedSkillsRequired: string[];
  advancedSkillsMatched: string[];
  seniorityBonusOrPenaltyPct: number;
  summary: string;
}

export const inferTargetSeniority = (
  jobTitle?: string,
  jobDescription?: string,
): SeniorityBand => {
  const titleLower = (jobTitle ?? "").toLowerCase();
  const fullLower = `${titleLower}\n${(jobDescription ?? "").toLowerCase()}`;

  if (
    /\b(principal|staff|distinguished|architect|head of|vp of engineering)\b/.test(
      titleLower,
    )
  ) {
    return "STAFF_PRINCIPAL";
  }
  if (/\b(senior|sr\.?|lead|sde\s*iii|sde-3|tech lead)\b/.test(titleLower)) {
    return "SENIOR";
  }
  if (
    /\b(intern|internship|graduate|fresher|junior|jr\.?|entry[- ]level|associate|sde\s*i|sde-1)\b/.test(
      titleLower,
    )
  ) {
    return "JUNIOR";
  }

  const yrsMatch = fullLower.match(/(\d{1,2})\+?\s*years?/);
  if (yrsMatch) {
    const yrs = Number(yrsMatch[1]);
    if (yrs >= 7) return "STAFF_PRINCIPAL";
    if (yrs >= 4) return "SENIOR";
    if (yrs <= 1) return "JUNIOR";
  }

  return "MID";
};

export const inferCandidateSeniority = (
  experienceYrs?: number | null,
): SeniorityBand => {
  const yrs = typeof experienceYrs === "number" ? experienceYrs : 0;
  if (yrs >= 7) return "STAFF_PRINCIPAL";
  if (yrs >= 4) return "SENIOR";
  if (yrs >= 2) return "MID";
  return "JUNIOR";
};

const BAND_RANK: Record<SeniorityBand, number> = {
  JUNIOR: 1,
  MID: 2,
  SENIOR: 3,
  STAFF_PRINCIPAL: 4,
};

export const evaluateSenioritySkillAlignment = (params: {
  jobTitle?: string;
  jobDescription?: string;
  candidateExperienceYrs?: number | null;
  requiredSkills: string[];
  matchedSkills: string[];
}): SenioritySkillAssessment => {
  const targetSeniority = inferTargetSeniority(
    params.jobTitle,
    params.jobDescription,
  );
  const candidateSeniority = inferCandidateSeniority(
    params.candidateExperienceYrs,
  );
  const matchedSet = new Set(params.matchedSkills);

  const advancedSkillsRequired = params.requiredSkills.filter(
    (sk) => CANONICAL_SKILL_MAP.get(sk)?.tier === "advanced",
  );
  const advancedSkillsMatched = advancedSkillsRequired.filter((sk) =>
    matchedSet.has(sk),
  );

  const rankDiff = BAND_RANK[candidateSeniority] - BAND_RANK[targetSeniority];
  const seniorityAligned = rankDiff >= 0;

  let adjustment = 0;
  if (
    (targetSeniority === "SENIOR" || targetSeniority === "STAFF_PRINCIPAL") &&
    advancedSkillsRequired.length > 0
  ) {
    const advRatio =
      advancedSkillsMatched.length / advancedSkillsRequired.length;
    if (advRatio >= 0.75 && seniorityAligned) adjustment = 4;
    else if (advRatio < 0.4) adjustment = -6;
  }

  const summary =
    targetSeniority === "SENIOR" || targetSeniority === "STAFF_PRINCIPAL"
      ? `${targetSeniority.replace("_", "/")} role expects architectural & advanced depth (${advancedSkillsMatched.length}/${advancedSkillsRequired.length} advanced skills matched; candidate band: ${candidateSeniority.replace("_", "/")}).`
      : `${targetSeniority} role focuses on core implementation fundamentals (${params.matchedSkills.length}/${params.requiredSkills.length} skills matched).`;

  return {
    targetSeniority,
    candidateSeniority,
    seniorityAligned,
    advancedSkillsRequired,
    advancedSkillsMatched,
    seniorityBonusOrPenaltyPct: adjustment,
    summary,
  };
};
