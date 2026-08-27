//server/src/services/applications/applicationService.ts

import { prisma } from "../config/db";
import {
  createApplication,
  getApplication,
  getApplicationById,
  updatedApplicationStatus,
} from "../repositories/applicationRepository";
import type { ApplicationStatus } from "@prisma/client";

export const createApplicationService = async (
  userId: string,
  jobId: string,
) => {
  const job = await prisma.job.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  return await createApplication(userId, jobId);
};

export const getApplicationsService = async (userId: string) => {
  return await getApplication(userId);
};

export const getApplicationByIdService = async (
  userId: string,
  applicationId: string,
) => {
  const application = await getApplicationById(userId, applicationId);
  if (!application) {
    throw new Error("Application not found");
  }

  return application;
};

export const updateApplicationStatusService = async (
  userId: string,
  applicationId: string,
  status: ApplicationStatus,
) => {
  const application = await getApplicationById(userId, applicationId);

  if (!application) {
    throw new Error("Application not found");
  }

  await updatedApplicationStatus(userId, applicationId, status);

  //once updated then return application to requested id
  return await getApplicationById(userId, applicationId);
};
