// src/repositories/resumeRepository.ts
import { prisma } from "../config/db";

export const createResume = async (data: {
  userId: string;
  title: string;
  rawText?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}) => {
  return await prisma.resume.create({
    data: {
      userId: data.userId,
      title: data.title,
      rawText: "",
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
    },
  });
};
