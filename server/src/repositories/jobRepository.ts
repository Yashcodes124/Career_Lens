import type { JobQuery } from "../utils/jobQuery";
import { Prisma } from "@prisma/client";
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
      isActive: true,
      lastSyncedAt: new Date(),
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
      isActive: true,
      lastSyncedAt: new Date(),
    },
  });
};
//Creating , updating and Storing the jobs
export const upsertJobs = async (jobs: CanonicalJob[]) => {
  const results = [];

  for (const job of jobs) {
    //select a job from jobs and store as array
    const result = await upsertJob(job);
    results.push(result);
  }
  return results;
};

//find the jobs that are active
export const getJobs = async (filters: JobQuery) => {
  const where: Prisma.JobWhereInput = { isActive: true };

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { company: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.location) {
    where.location = { contains: filters.location, mode: "insensitive" };
  }
  if (filters.source) {
    where.source = filters.source;
  }

  const [jobs, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      orderBy: { lastSyncedAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total };
};


//find a active job
export const getJobById = async (id: string) => {
  return await prisma.job.findFirst({
    where: {
      id,
      isActive: true,
    },
  });
};
