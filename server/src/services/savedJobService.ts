import { prisma } from "../config/db";
import { AppError } from "../utils/appError";
import {
  getSavedJobs,
  saveJob,
  unsaveJob,
} from "../repositories/savedJobRepository";

export const saveJobService = async (userId: string, jobId: string) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, isActive: true },
  });

  if (!job || !job.isActive) {
    throw new AppError(404, "Job not found", "JOB_NOT_FOUND");
  }
  return await saveJob(userId, jobId);
};

export const unsaveJobService = async (userId: string, jobId: string) => {
  const result = await unsaveJob(userId, jobId);

  if (result.count === 0) {
    throw new AppError(404, "Saved job not found", "SAVED_JOB_NOT_FOUND");
  }
  return true;
};

export const getSavedJobsService = async (userId: string) => {
  return await getSavedJobs(userId);
};
