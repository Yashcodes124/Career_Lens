//server/src/repositories/applicationRepository.ts

import { prisma } from "../config/db";
import { ApplicationStatus } from "@prisma/client";

//POST  /api/jobs/:id/apply
export const createApplication = async (userId: string, jobId: string) => {
  return await prisma.application.upsert({
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

// GET   /api/applications
export const getApplication = async (userId: string) => {
  return await prisma.application.findMany({
    where: {
      userId,
    },
    include: {
      job: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
};

//GET   /api/applications/:id
export const getApplicationById = async (
  userId: string,
  applicationId: string,
) => {
  return await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId,
    },
    include: {
      job: true,
    },
  });
};

//PATCH /api/applications/:id/status
export const updatedApplicationStatus = async (
  userId: string,
  applicationId: string,
  status: ApplicationStatus,
) => {
  return await prisma.application.updateMany({
    where: {
      id: applicationId,
      userId,
    },
    data: {
      status,
    },
  });
};
