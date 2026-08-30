import { prisma } from "../../config/db";
import { calculateMatch, MatchResult } from "./matchingService";

//Calculate score for a job
export const matchResumeToJob = async (
  userId: string,
  resumeId: string,
  jobId: string,
): Promise<MatchResult> => {
  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      userId,
    },
  });
  if (!resume) {
    throw new Error("Resume not found.");
  }

  const job = await prisma.job.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }
  //extract the skills
  const parsedData = resume.parsedData as {
    skills?: string[];
  } | null;

  const resumeSkills = parsedData?.skills ?? [];
  return calculateMatch(resumeSkills, job.requirements);
};
