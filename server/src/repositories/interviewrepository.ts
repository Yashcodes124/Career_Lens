// server/src/modules/interview/interview.repository.ts

import { prisma } from "../config/db";

export const createInterview = async (data: {
  userId: string;
  applicationId: string;
  title: string;
  plan: object;
}) => {
  return await prisma.interview.create({
    data,
  });
};

