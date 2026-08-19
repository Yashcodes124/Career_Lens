// src/repositories/resumeRepository.ts
import { constrainedMemory } from "process";
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

//Get the authenticated user's resume :
// GET /api/resumes
export const getResumeByUserId = async (userId: string) => {
  return await prisma.resume.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
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
