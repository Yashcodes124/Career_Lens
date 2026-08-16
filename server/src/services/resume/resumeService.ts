import { createResume } from "../../repositories/resumeRepository";
import { extractTextFromDocument } from "../../utils/documentParser";

export const createResumeService = async (
  userId: string,
  file: Express.Multer.File,
) => {
  const rawText = await extractTextFromDocument(file.buffer, file.mimetype,file.originalname);

  return await createResume({
    userId,
    title: file.originalname,
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    rawText,
  });
};
