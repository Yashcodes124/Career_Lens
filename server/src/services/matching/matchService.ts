import { AppError } from "../../utils/appError";
import { getResumeById } from "../../repositories/resumeRepository";
import { getJobById } from "../../repositories/jobRepository";
import { upsertApplicationMatch } from "../../repositories/matchRepository";
import { calculateMatch, MatchResult } from "./matchingService";

export interface MatchResponseData extends MatchResult {
  applicationId: string;
}

export const matchResumeToJob = async (
  userId: string,
  resumeId: string,
  jobId: string,
): Promise<MatchResponseData> => {
  const resume = await getResumeById(resumeId, userId);
  if (!resume) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }

  const job = await getJobById(jobId);
  if (!job || !job.isActive) {
    throw new AppError(404, "Job not found", "JOB_NOT_FOUND");
  }

  const result = calculateMatch(resume.skills, job.requirements, job.description);

  // Saved on the application so the interview and tracker use the same numbers.
  const application = await upsertApplicationMatch(userId, jobId, {
    matchScore: result.score,
    skillGaps: result.skillGaps.map((gap) => gap.skill),
  });

  return { ...result, applicationId: application.id };
};
