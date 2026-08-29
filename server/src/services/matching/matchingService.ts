//server/src/services/matching/matchingService.ts

import { normalizeSkills } from "./skillNormalizer";

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
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

  return {
    score,
    matchedSkills,
    missingSkills,
  };
};
