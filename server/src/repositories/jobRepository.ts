//src\repositories\jobRepository.ts

import { prisma } from "../config/db";
import type { CanonicalJob } from "../integrations/jobs/greenhouse/greenhouseAdapter";

export const upsertJob = async (job: CanonicalJob) => {
  //Upsert : cobination of  update and insert
  return await prisma.job.upsert({
    where: {
      //if has same id means: to prevent duplicates
      externalId: job.externalId,
    },
    //ypdate with the latest details
    update: {
      source: job.source,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      requirements: job.requirements,
      salaryRange: job.salaryRange,
      url: job.url,
    },
    //found new , create a new job record
    create: {
      externalId: job.externalId,
      source: job.source,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      requirements: job.requirements,
      salaryRange: job.salaryRange,
      url: job.url,
    },
  });
};

export const upsertJobs = async (jobs: CanonicalJob[]) => {
  const results = [];

  for (const job of jobs) {
    //select a job from jobs and store as array
    const result = await upsertJob(job);
    results.push(result);
  }
  return results;
};
