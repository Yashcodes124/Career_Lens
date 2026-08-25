import { prisma } from "../config/db";

//insert and update saved job: prevents duplication
//POST   /api/jobs/:id/save
export const saveJob = async (userId: string, jobId: string) => {
  return await prisma.savedJob.upsert({
    where: {
      userId_jobId: {
        userId,
        jobId,
      },
    },
    update: {},
    create: {
      userId,
      jobId,
    },
    include: {
      job: true,
    },
  });
};

//delete endpoint for saved job
//DELETE /api/jobs/:id/save
export const unsaveJob = async (userId: string, jobId: string) => {
  return await prisma.savedJob.deleteMany({
    where: {
      userId,
      jobId,
    },
  });
};

//get the saved jobs in the order of created
// GET / api / jobs / saved
export const getSavedJobs = async (userId: string) => {
  const savedJobs = await prisma.savedJob.findMany({
    where: {
      userId,
    },
    include: {
      job: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return savedJobs.map((savedJob) => savedJob.job);
};
