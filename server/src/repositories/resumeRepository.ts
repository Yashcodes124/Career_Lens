// src/repositories/resumeRepository.ts
import { prisma } from "../config/db";

export const createResume = async (data: {
  userId: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  rawText: string;
}) => {
  return await prisma.resume.create({
    data,
  });
};
