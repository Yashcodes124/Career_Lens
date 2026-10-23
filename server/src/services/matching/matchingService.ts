// Deterministic resume-to-job matching. Every number here can be traced to a skill name
// or a count of mentions in the job description. No model is involved.
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

const PRIORITY_ORDER: Record<GapPriority, number> = { high: 0, medium: 1, low: 2 };

// A skill named three or more times in the posting is core to the role.
const priorityFromMentions = (mentions: number): GapPriority => {
  if (mentions >= 3) return "high";
  if (mentions === 2) return "medium";
  return "low";
};

export const calculateMatch = (
  resumeSkills: string[],
  jobSkills: string[],
  jobDescription?: string,
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

  const candidateSkills = new Set(normalizeSkills(resumeSkills));
  const matchedSkills = requiredSkills.filter((skill) => candidateSkills.has(skill));
  const missingSkills = requiredSkills.filter((skill) => !candidateSkills.has(skill));

  const mentions = jobDescription ? countSkillMentions(jobDescription) : null;

  const skillGaps: SkillGap[] = missingSkills
    .map((skill) => {
      const count = mentions?.get(skill) ?? 0;
      const priority: GapPriority = mentions ? priorityFromMentions(count) : "medium";
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
