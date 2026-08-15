// src/repositories/resumeRepository.ts
import { prisma } from "../config/db";

export const createResume = async (data: {
  userId: string;
  title: string;
  rawText?: string;
}) => {
  return await prisma.resume.create({
    data: {
      userId: data.userId,
      title: data.title,
      rawText: data.rawText || "",
    },
  });
};
