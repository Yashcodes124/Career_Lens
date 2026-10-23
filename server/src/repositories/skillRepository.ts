import { prisma } from "../config/db";
import { FinalEvaluation } from "../modules/evaluation/finalEvaluationSchema";
import { SkillEvidence } from "../services/skills/skillEvidence";

export const listUserSkills = async (userId: string) => {
  return await prisma.userSkill.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
};

export const countUserResumes = async (userId: string) => {
  return await prisma.resume.count({ where: { userId } });
};

export const hasScoredApplication = async (userId: string) => {
  const count = await prisma.application.count({
    where: { userId, matchScore: { not: null } },
  });
  return count > 0;
};

// The report and its skill updates are written in one transaction.
// A report never exists without the skill updates it produced.
export const saveEvaluationWithSkillEvidence = async (
  interviewId: string,
  userId: string,
  evaluation: FinalEvaluation,
  evidence: SkillEvidence[],
) => {
  return await prisma.$transaction(async (tx) => {
    const saved = await tx.evaluation.create({
      data: {
        interviewId,
        score: evaluation.score,
        feedback: evaluation.feedback,
        breakdown: {
          ...evaluation.breakdown,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          recommendation: evaluation.recommendation,
        },
      },
    });

    for (const item of evidence) {
      await tx.userSkill.upsert({
        where: { userId_skill: { userId, skill: item.skill } },
        create: { userId, skill: item.skill, status: item.status, evidence: item.evidence },
        update: { status: item.status, evidence: item.evidence },
      });
    }
    return saved;
  });
};
