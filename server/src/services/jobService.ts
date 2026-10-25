import type { JobQuery } from "../utils/jobQuery";
//src\services\jobService.ts

import { getJobs, getJobById } from "../repositories/jobRepository";

export const getJobsService = async (filters: JobQuery) => {
  return await getJobs(filters);
};

export const getJobByIdService = async (id: string) => {
  const job = await getJobById(id);

  if (!job) {
    throw new Error("Job not found");
  }

  return job;
};

