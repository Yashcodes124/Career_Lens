import { prisma } from "../config/db";
import {
  getSavedJobs,
  saveJob,
  unsaveJob,
} from "../repositories/savedJobRepository";

export const saveJobService = async (userId: string, jobId: string) => {
  const job = await prisma.job.findMany({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }
  return await saveJob(userId, jobId);
};

export const unsaveJobService = async (userId: string, jobId: string) => {
  const result = await unsaveJob(userId, jobId);

  if (result.count === 0) {
    throw new Error("Saved job not found");
  }
  return true;
};

export const getSavedJobsService = async (userId: string) => {
  return await getSavedJobs(userId);
};
