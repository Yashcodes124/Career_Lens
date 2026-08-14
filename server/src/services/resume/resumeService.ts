import { createResume } from "../../repositories/resumeRepository";

export const createResumeService = async (userId: string, title: string) => {
  return await createResume({
    userId,
    title,
  });
};
