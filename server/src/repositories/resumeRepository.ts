import prisma from "@prisma/client";

export const createResume = async (data: { userId: string; title: string }) => {
  return await prisma.resume.create({
    data,
  });
};
