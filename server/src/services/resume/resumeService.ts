// PDF/DOCX -> raw text -> AI extraction -> Zod validation -> PostgreSQL
import { createResume, deleteResumeForUser, getResumeById, getResumeByUserId } from "../../repositories/resumeRepository";
import { extractTextFromDocument, getResumeFormat, RESUME_MIME_TYPES } from "../../utils/documentParser";
import { buildResumeAnalysisPrompt } from "../../integrations/ai/resumePrompt";
import { analyzeResume } from "../../integrations/ai/aiClient";
import { resumeAnalysisSchema, ResumeAnalysis } from "../../integrations/ai/resumeSchema";
import { AppError } from "../../utils/appError";

const MIN_READABLE_CHARACTERS = 40;
const MAX_ANALYSIS_ATTEMPTS = 2;
const MAX_SKILLS = 100;
const MAX_TITLE_LENGTH = 255;

// Trims, collapses whitespace, removes case-insensitive duplicates, and caps the list.
// This is only tidying. Matching-time alias normalization lives in the matching engine.
export const cleanSkillList = (skills: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of skills) {
    const skill = raw.replace(/\s+/g, " ").trim();
    const key = skill.toLowerCase();
    if (!skill || seen.has(key)) continue;

    seen.add(key);
    result.push(skill);
    if (result.length === MAX_SKILLS) break;
  }

  return result;
};

const clampExperienceYears = (years: number): number =>
  Math.min(Math.max(Math.round(years), 0), 60);

// Retries only when the model returns output that fails validation.
// Provider outages are not retried here, because the same request would fail again.
export const analyzeResumeText = async (rawText: string): Promise<ResumeAnalysis> => {
  const prompt = buildResumeAnalysisPrompt(rawText);

  for (let attempt = 1; attempt <= MAX_ANALYSIS_ATTEMPTS; attempt++) {
    try {
      const output = await analyzeResume(prompt);
      const parsed = resumeAnalysisSchema.safeParse(output);
      if (parsed.success) return parsed.data;
    } catch (error) {
      const isInvalidOutput =
        error instanceof AppError && error.code === "AI_INVALID_OUTPUT";
      if (!isInvalidOutput) throw error;
    }
  }

  throw new AppError(
    422,
    "We could not read the structure of this resume. Try another file.",
    "RESUME_UNPARSEABLE",
  );
};

export const createResumeService = async (
  userId: string,
  file: Express.Multer.File,
) => {
  const format = getResumeFormat(file.originalname);
  if (!format) {
    throw new AppError(400, "Only PDF and DOCX files are allowed", "UNSUPPORTED_FILE_TYPE");
  }

  const rawText = await extractTextFromDocument(file.buffer, file.originalname);
  if (rawText.replace(/\s/g, "").length < MIN_READABLE_CHARACTERS) {
    throw new AppError(
      422,
      "No readable text was found. Scanned PDFs are not supported yet. Upload a text-based PDF or a DOCX file.",
      "NO_READABLE_TEXT",
    );
  }

  const analysis = await analyzeResumeText(rawText);
  const skills = cleanSkillList(analysis.skills);

  return createResume({
    userId,
    title: file.originalname.slice(0, MAX_TITLE_LENGTH),
    fileName: file.originalname,
    mimeType: RESUME_MIME_TYPES[format],
    fileSize: file.size,
    rawText,
    parsedData: { ...analysis, skills },
    skills,
    experienceYrs: clampExperienceYears(analysis.totalExperienceYears),
  });
};

export const getUserResumeService = async (userId: string) => {
  return await getResumeByUserId(userId);
};

export const getUserResumeByIdService = async (userId: string, resumeId: string) => {
  const resume = await getResumeById(resumeId, userId);
  if (!resume) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }
  return resume;
};

export const deleteResumeService = async (userId: string, resumeId: string) => {
  const result = await deleteResumeForUser(resumeId, userId);
  if (result.count === 0) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }
};
