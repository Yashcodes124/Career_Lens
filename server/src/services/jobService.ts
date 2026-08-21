//src\services\jobService.ts

import { getJobs, getJobById } from "../repositories/jobRepository";

export const getJobsService = async () => {
  return await getJobs();
};

export const getJobByIdService = async (id: string) => {
  const job = await getJobById(id);

  if (!job) {
    throw new Error("Job not found");
  }

  return job;
};

