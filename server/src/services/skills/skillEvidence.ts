// Turns an interview report into skill evidence. Only skills in the shared dictionary count,
// so the result is deterministic and every entry can be traced to a sentence in the report.
import { countSkillMentions } from "../matching/skillDictionary";

export type SkillEvidenceStatus = "STRONG" | "WEAK";

export interface SkillEvidence {
  skill: string;
  status: SkillEvidenceStatus;
  evidence: string;
}

export const skillEvidenceFromReport = (report: {
  strengths: string[];
  improvements: string[];
}): SkillEvidence[] => {
  const weak = [...countSkillMentions(report.improvements.join(". ")).keys()];
  // A skill named under both headings is treated as weak, the more cautious reading.
  const strong = [...countSkillMentions(report.strengths.join(". ")).keys()].filter(
    (skill) => !weak.includes(skill),
  );

  return [
    ...weak.map((skill) => ({
      skill,
      status: "WEAK" as const,
      evidence: "Named under improvements in a mock interview report",
    })),
    ...strong.map((skill) => ({
      skill,
      status: "STRONG" as const,
      evidence: "Named under strengths in a mock interview report",
    })),
  ];
};
