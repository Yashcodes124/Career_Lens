//src\services\greenhouseSyncService.ts

// Greenhouse API
//       ↓
// fetchGreenhouseJobs()
//       ↓
// Zod validation
//       ↓
// adaptGreenhouseJobs()
//       ↓
// CanonicalJob[]
//       ↓
// upsertJobs()
//       ↓
// isActive = true
// lastSyncedAt = now
//       ↓
// Deactivate missing jobs
// PostgreSQL

import { prisma } from "../config/db";
import { fetchGreenhouseJobs } from "../integrations/jobs/greenhouse/greenhouseClient";
import { adaptGreenhouseJobs } from "../integrations/jobs/greenhouse/greenhouseAdapter";
import { upsertJobs } from "../repositories/jobRepository";

export const syncGreenhouseJobs = async (
  boardToken: string,
  company: string,
) => {
  // 1. Fetch and validate Greenhouse jobs
  const response = await fetchGreenhouseJobs(boardToken);

  // 2. Convert Greenhouse jobs into our canonical Job format
  const jobs = adaptGreenhouseJobs(response.jobs, company);

  // 3. Persist jobs using upsert
  const savedJobs = await upsertJobs(jobs);

  //4.to prevent unactive jobs after some time
  const externalIds = jobs.map((job) => job.externalId);

  const staleJobs = await prisma.job.updateMany({
    where: {
      source: "GREENHOUSE",
      company,
      ...(externalIds.length > 0
        ? {
            externalId: {
              notIn: externalIds,
            },
          }
        : {}),
    },
    data: {
      isActive: false,
    },
  });

  return {
    totalFetched: jobs.length,
    totalSaved: savedJobs.length,
    totalDeactivated: staleJobs.count,
  };
};
