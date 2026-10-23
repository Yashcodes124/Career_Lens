import { prisma } from "../config/db";

// Stores the latest match on the user's application for this job.
// Creates the application as SAVED if the user has not tracked the job yet.
export const upsertApplicationMatch = async (
  userId: string,
  jobId: string,
  data: { matchScore: number | null; skillGaps: string[] },
) => {
  return await prisma.application.upsert({
    where: { userId_jobId: { userId, jobId } },
    create: { userId, jobId, ...data },
    update: data,
    select: { id: true },
  });
};
