import { countUserResumes, hasScoredApplication, listUserSkills } from "../../repositories/skillRepository";
import { decideNextAction } from "./nextAction";

export const getReadinessService = async (userId: string) => {
  const [skills, resumeCount, scored] = await Promise.all([
    listUserSkills(userId),
    countUserResumes(userId),
    hasScoredApplication(userId),
  ]);

  const weakSkills = skills
    .filter((s) => s.status === "WEAK")
    .map((s) => ({ skill: s.skill, evidence: s.evidence }));

  const nextAction = decideNextAction({
    hasResume: resumeCount > 0,
    weakSkills,
    hasScoredApplication: scored,
  });

  return {
    skills: skills.map((s) => ({
      skill: s.skill,
      status: s.status,
      evidence: s.evidence,
      updatedAt: s.updatedAt,
    })),
    nextAction,
  };
};
