//server/src/resume/resumeService.ts

import { createResume } from "../../repositories/resumeRepository";

export const createResumeService = async (data: {
  userId: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}) => {
  return await createResume(data);
};
