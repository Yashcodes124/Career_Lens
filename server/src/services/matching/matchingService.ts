//server/src/services/matching/matchingService.ts

import { normalizeSkills } from "./skillNormalizer";

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

export const calculateMatch = (
  resumeSkills: string[],
  jobSkills: string[],
): MatchResult => {
  const normalizedResumeSkills = normalizeSkills(resumeSkills);
  const normalizedJobSkills = normalizeSkills(jobSkills);

  const resumeSkillSet = new Set(normalizedResumeSkills);

  const matchedSkills = normalizedJobSkills.filter((skill) =>
    resumeSkillSet.has(skill),
  );

  const missingSkills = normalizedJobSkills.filter(
    (skill) => !resumeSkillSet.has(skill),
  );

  const score =
    normalizedJobSkills.length === 0
      ? 0
      : Math.round((matchedSkills.length / normalizedJobSkills.length) * 100);

  const skillGaps: SkillGap[] = missingSkills.map((skill) => ({
    skill,
    priority: "high",
  }));

  return {
    score,
    matchedSkills,
    missingSkills,
    skillGaps,
  };
};
