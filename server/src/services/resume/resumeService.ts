//src/services/resume/resumeServices

// file(PDF / DOCX)
//    ↓
// Multer
//    ↓
// extractTextFromDocument()
//    ↓
// rawText
//    ↓
// buildResumeAnalysisPrompt()
//    ↓
// Qwen3:4b via Ollama
//    ↓
// JSON
//    ↓
// Zod validation
//    ↓
// createResume()
//    ↓
// PostgreSQL

import { createResume } from "../../repositories/resumeRepository";
import { extractTextFromDocument } from "../../utils/documentParser";
import { buildResumeAnalysisPrompt } from "../../integrations/ai/resumePrompt";
import { analyzeResume } from "../../integrations/ai/ollama";
import path from "path";
import {
  getResumeById,
  getResumeByUserId,
} from "../../repositories/resumeRepository";

export const createResumeService = async (
  userId: string,
  file: Express.Multer.File,
) => {
  //1.extract the raw text from the uploaded file
  const rawText = await extractTextFromDocument(
    file.buffer,
    file.mimetype,
    file.originalname,
  );

  //CHECK FOR MIME TYPE CONFIRMATION
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType =
    extension === ".pdf"
      ? "application/pdf"
      : extension === ".docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : file.mimetype;

  //2.Build a Ai prompt
  const prompt = buildResumeAnalysisPrompt(rawText);
  //3.Call the resume anlyser to run ollama extraction
  const analysis = await analyzeResume(prompt);
  //4.Map the fields and
  //5.Pass them to create resume
  const resume = await createResume({
    userId,
    title: file.originalname,
    fileName: file.originalname,
    mimeType: mimeType,
    fileSize: file.size,
    rawText,
    parsedData: analysis,
    skills: analysis.skills,
    experienceYrs: analysis.totalExperienceYears,
  });
  return resume;
};

export const getUserResumeService = async (userId: string) => {
  return await getResumeByUserId(userId);
};

export const getUserResumeByIdService = async (
  userId: string,
  resumeId: string,
) => {
  const resume = await getResumeById(resumeId, userId);
  if (!resume) {
    throw new Error("Resume not found");
  }

  return resume;
};
