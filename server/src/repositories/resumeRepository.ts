// src/repositories/resumeRepository.ts
import { prisma } from "../config/db";

// Create a resume
export const createResume = async (data: {
  userId: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  rawText: string;
  parsedData?: object;
  skills?: string[];
  experienceYrs?: number;
}) => {
  return await prisma.resume.create({
    data,
  });
};

// GET /api/resumes: newest first. rawText is left out of list responses.
export const getResumeByUserId = async (userId: string) => {
  return await prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      fileName: true,
      mimeType: true,
      fileSize: true,
      parsedData: true,
      skills: true,
      experienceYrs: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// GET /api/resumes/:id
export const getResumeById = async (resumeId: string, userId: string) => {
  return await prisma.resume.findFirst({
    where: {
      id: resumeId,
      userId,
    },
  });
};

// DELETE /api/resumes/:id. The userId filter makes this owner-only.
export const deleteResumeForUser = async (resumeId: string, userId: string) => {
  return await prisma.resume.deleteMany({
    where: { id: resumeId, userId },
  });
};
