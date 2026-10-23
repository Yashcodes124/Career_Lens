// Deterministic resume-to-job matching. Every number can be traced to a skill name,
// a count of mentions in the job description, or an interview report. No model is involved.
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

// Interview evidence from earlier mock interviews. It changes what the candidate is credited with.
export interface InterviewEvidence {
  strongSkills: string[];
  weakSkills: Map<string, string>; // skill -> evidence text
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

  const weakSkills = interview?.weakSkills ?? new Map<string, string>();

  // Credit comes from the resume and from strong interview evidence.
  // A skill flagged as weak in an interview is not credited, even if the resume lists it.
  const candidateSkills = new Set(normalizeSkills(resumeSkills));
  for (const skill of interview?.strongSkills ?? []) candidateSkills.add(skill);
  for (const skill of weakSkills.keys()) candidateSkills.delete(skill);

  const matchedSkills = requiredSkills.filter((skill) => candidateSkills.has(skill));
  const missingSkills = requiredSkills.filter((skill) => !candidateSkills.has(skill));

  const mentions = jobDescription ? countSkillMentions(jobDescription) : null;

  const skillGaps: SkillGap[] = missingSkills
    .map((skill) => {
      if (weakSkills.has(skill)) {
        return {
          skill,
          priority: "high" as const,
          evidence: "Weak in a mock interview. Practise it before the next interview.",
        };
      }
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
