// PDF/DOCX -> raw text -> AI extraction -> Zod validation -> PostgreSQL
import {
  createResume,
  deleteResumeForUser,
  getResumeById,
  getResumeByUserId,
  updateResumeForUser,
} from "../../repositories/resumeRepository";
import {
  extractTextFromDocument,
  getResumeFormat,
  RESUME_MIME_TYPES,
} from "../../utils/documentParser";
import { buildResumeAnalysisPrompt } from "../../integrations/ai/resumePrompt";
import { analyzeResume } from "../../integrations/ai/aiClient";
import {
  resumeAnalysisSchema,
  ResumeAnalysis,
} from "../../integrations/ai/resumeSchema";
import { AppError } from "../../utils/appError";
import { countSkillMentions } from "../matching/skillDictionary";
import {
  recordFeatureEvent,
  recordResumeParseAudit,
} from "../telemetry/telemetryService";

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
export const analyzeResumeText = async (
  rawText: string,
  userId?: string,
): Promise<ResumeAnalysis> => {
  const prompt = buildResumeAnalysisPrompt(rawText);

  for (let attempt = 1; attempt <= MAX_ANALYSIS_ATTEMPTS; attempt++) {
    try {
      const output = await analyzeResume(prompt, "default", {
        userId,
        feature: "RESUME_ANALYSIS",
        schema: resumeAnalysisSchema,
      });
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
  const startedAt = Date.now();
  const format = getResumeFormat(file.originalname);
  if (!format) {
    throw new AppError(
      400,
      "Only PDF and DOCX files are allowed",
      "UNSUPPORTED_FILE_TYPE",
    );
  }

  const rawText = await extractTextFromDocument(file.buffer, file.originalname);
  if (rawText.replace(/\s/g, "").length < MIN_READABLE_CHARACTERS) {
    recordResumeParseAudit({
      userId,
      mimeType: RESUME_MIME_TYPES[format],
      status: "FAILED",
      qualityScore: 0,
      textLength: rawText.length,
      warnings: ["NO_READABLE_TEXT"],
      durationMs: Date.now() - startedAt,
    });
    recordFeatureEvent({
      userId,
      event: "resume_parse_failed",
      metadata: { format },
    });
    throw new AppError(
      422,
      "No readable text was found. Scanned PDFs are not supported yet. Upload a text-based PDF or a DOCX file.",
      "NO_READABLE_TEXT",
    );
  }

  let analysis: ResumeAnalysis;
  try {
    analysis = await analyzeResumeText(rawText, userId);
  } catch (err) {
    recordResumeParseAudit({
      userId,
      mimeType: RESUME_MIME_TYPES[format],
      status: "FAILED",
      qualityScore: 0,
      textLength: rawText.length,
      warnings: ["AI_ANALYSIS_FAILED"],
      durationMs: Date.now() - startedAt,
    });
    recordFeatureEvent({
      userId,
      event: "resume_parse_failed",
      metadata: { format },
    });
    throw err;
  }

  const skills = cleanSkillList(analysis.skills);
  const parsingQuality = computeResumeParsingQuality({
    rawText,
    skills,
    parsedData: analysis,
    fileSize: file.size,
  });

  const created = await createResume({
    userId,
    title: file.originalname.slice(0, MAX_TITLE_LENGTH),
    fileName: file.originalname,
    mimeType: RESUME_MIME_TYPES[format],
    fileSize: file.size,
    rawText,
    parsedData: { ...analysis, skills, parsingQuality },
    skills,
    experienceYrs: clampExperienceYears(analysis.totalExperienceYears),
  });

  recordResumeParseAudit({
    userId,
    resumeId: created.id,
    mimeType: RESUME_MIME_TYPES[format],
    status: parsingQuality.level === "LOW" ? "LOW_QUALITY" : "SUCCESS",
    qualityScore: parsingQuality.score,
    textLength: rawText.length,
    warnings: parsingQuality.warnings,
    durationMs: Date.now() - startedAt,
  });
  recordFeatureEvent({
    userId,
    event: "resume_uploaded",
    metadata: {
      skillsCount: skills.length,
      qualityScore: parsingQuality.score,
    },
  });

  return created;
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
export interface ResumeParsingWarning {
  code:
    | "SCANNED_OR_LOW_TEXT"
    | "TABLE_OR_COLUMN_LAYOUT"
    | "MISSING_EXPERIENCE"
    | "MISSING_PROJECTS"
    | "NO_TECHNICAL_SKILLS"
    | "AI_FALLBACK_USED";
  severity: "warning" | "danger" | "info";
  title: string;
  detail: string;
}

export interface ResumeParsingQuality {
  score: number;
  level: "HIGH" | "MEDIUM" | "LOW";
  outcome: "PARSED_CLEAN" | "NO_RELEVANT_SKILLS" | "AI_PARSE_DEGRADED";
  outcomeSummary: string;
  charCount: number;
  wordCount: number;
  warnings: ResumeParsingWarning[];
}

export const computeResumeParsingQuality = (params: {
  rawText?: string | null;
  skills?: string[];
  parsedData?: (Partial<ResumeAnalysis> & { parseMode?: string }) | null;
  fileSize?: number | null;
}): ResumeParsingQuality => {
  const text = (params.rawText ?? "").trim();
  const charCount = text.replace(/\s/g, "").length;
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const skills = params.skills ?? params.parsedData?.skills ?? [];
  const experience = params.parsedData?.experience ?? [];
  const projects = params.parsedData?.projects ?? [];
  const education = params.parsedData?.education ?? [];
  const usedFallback =
    params.parsedData?.parseMode === "DETERMINISTIC_FALLBACK";

  const warnings: ResumeParsingWarning[] = [];
  let score = 100;

  // 1. Scanned PDF or abnormally low text extraction
  const isLargeFileWithTinyText =
    (params.fileSize ?? 0) > 150_000 && charCount > 0 && charCount < 450;
  if (isLargeFileWithTinyText || (charCount > 0 && charCount < 250)) {
    score -= 35;
    warnings.push({
      code: "SCANNED_OR_LOW_TEXT",
      severity: "danger",
      title: "Low text extraction (possible scanned PDF or image layer)",
      detail: `Only ${charCount} readable characters were extracted. If your PDF is scanned, use "Paste resume text" or edit sections below.`,
    });
  }

  // 2. Multi-column / table layout fragmentation detection
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const pipeOrTabLines = lines.filter(
    (l) => /[|\t]/.test(l) || /\s{5,}/.test(l),
  ).length;
  const veryShortLines = lines.filter(
    (l) => l.length > 0 && l.length < 18,
  ).length;
  const hasTableOrColumnArtifacts =
    lines.length >= 12 &&
    (pipeOrTabLines >= 4 || veryShortLines / lines.length > 0.55);

  if (hasTableOrColumnArtifacts) {
    score -= 18;
    warnings.push({
      code: "TABLE_OR_COLUMN_LAYOUT",
      severity: "warning",
      title: "Multi-column or table formatting detected",
      detail:
        "Tables or side-by-side columns can scramble line reading order. Verify your Experience and Projects sections below.",
    });
  }

  // 3. Missing work experience section
  if (experience.length === 0) {
    score -= 20;
    warnings.push({
      code: "MISSING_EXPERIENCE",
      severity: "warning",
      title: "No structured work experience entries detected",
      detail:
        "No work/internship roles were extracted into the Experience section. You can add or edit experience entries directly.",
    });
  }

  // 4. Missing projects section
  if (projects.length === 0) {
    score -= 10;
    warnings.push({
      code: "MISSING_PROJECTS",
      severity: "info",
      title: "No structured project entries detected",
      detail:
        "Adding project descriptions with technologies strengthens claim verification during job matching.",
    });
  }

  // 5. Distinguish "AI could not parse structure" vs "Resume has no relevant skills"
  if (usedFallback) {
    score -= 20;
    warnings.push({
      code: "AI_FALLBACK_USED",
      severity: "warning",
      title:
        "AI structure parser degraded — recovered via deterministic extractor",
      detail:
        "The AI model could not structure all sections, so TrueHire extracted canonical skills directly from your text. Use Re-analyze or Edit Sections to refine.",
    });
  }

  if (skills.length === 0) {
    score -= 25;
    warnings.push({
      code: "NO_TECHNICAL_SKILLS",
      severity: "danger",
      title: "No recognized technical skills found",
      detail:
        "The document text was read, but no software engineering skills matched our dictionary. Add skills manually in the Skills tab.",
    });
  }

  const finalScore = Math.max(15, Math.min(100, score));
  const level: "HIGH" | "MEDIUM" | "LOW" =
    finalScore >= 80 ? "HIGH" : finalScore >= 55 ? "MEDIUM" : "LOW";

  let outcome: ResumeParsingQuality["outcome"] = "PARSED_CLEAN";
  let outcomeSummary =
    "AI extracted structured sections and verified technical skills cleanly.";

  if (
    usedFallback ||
    (experience.length === 0 && projects.length === 0 && education.length === 0)
  ) {
    outcome = "AI_PARSE_DEGRADED";
    outcomeSummary =
      "AI could not parse full section structure from this layout — recovered via deterministic text scan. Review or edit sections below.";
  } else if (skills.length === 0) {
    outcome = "NO_RELEVANT_SKILLS";
    outcomeSummary =
      "Document structure parsed clearly, but this resume lists no recognized technical skills yet.";
  }

  return {
    score: finalScore,
    level,
    outcome,
    outcomeSummary,
    charCount,
    wordCount,
    warnings,
  };
};

const buildDeterministicFallbackAnalysis = (
  rawText: string,
): ResumeAnalysis & { parseMode: string } => {
  const mentionedSkills = [...countSkillMentions(rawText).keys()];
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const summary =
    lines.slice(0, 4).join(" ").slice(0, 500) ||
    "Resume imported via text recovery.";
  const yearMatch = rawText.match(/(\d{1,2})\+?\s*years?\s+of\s+experience/i);
  const totalExperienceYears = yearMatch
    ? clampExperienceYears(Number(yearMatch[1]))
    : 0;

  return {
    summary,
    skills: mentionedSkills,
    education: [],
    experience: [],
    projects: [],
    totalExperienceYears,
    parseMode: "DETERMINISTIC_FALLBACK",
  };
};

export const createPastedResumeService = async (
  userId: string,
  input: { title?: string; rawText: string },
) => {
  const startedAt = Date.now();
  const rawText = (input.rawText ?? "").trim();
  if (rawText.replace(/\s/g, "").length < MIN_READABLE_CHARACTERS) {
    recordResumeParseAudit({
      userId,
      mimeType: "text/plain",
      status: "FAILED",
      qualityScore: 0,
      textLength: rawText.length,
      warnings: ["NO_READABLE_TEXT"],
      durationMs: Date.now() - startedAt,
    });
    recordFeatureEvent({
      userId,
      event: "resume_parse_failed",
      metadata: { format: "txt", source: "paste" },
    });
    throw new AppError(
      422,
      "Paste at least 40 characters of readable resume text.",
      "NO_READABLE_TEXT",
    );
  }

  const title = (input.title?.trim() || "Pasted_Resume.txt").slice(
    0,
    MAX_TITLE_LENGTH,
  );

  let analysis: ResumeAnalysis & { parseMode?: string };
  try {
    analysis = await analyzeResumeText(rawText, userId);
  } catch {
    analysis = buildDeterministicFallbackAnalysis(rawText);
  }

  const mergedSkills = cleanSkillList([
    ...analysis.skills,
    ...countSkillMentions(rawText).keys(),
  ]);
  const parsingQuality = computeResumeParsingQuality({
    rawText,
    skills: mergedSkills,
    parsedData: analysis,
    fileSize: Buffer.byteLength(rawText, "utf8"),
  });

  const created = await createResume({
    userId,
    title,
    fileName: title.endsWith(".txt") ? title : `${title}.txt`,
    mimeType: "text/plain",
    fileSize: Buffer.byteLength(rawText, "utf8"),
    rawText,
    parsedData: { ...analysis, skills: mergedSkills, parsingQuality },
    skills: mergedSkills,
    experienceYrs: clampExperienceYears(analysis.totalExperienceYears),
  });

  recordResumeParseAudit({
    userId,
    resumeId: created.id,
    mimeType: "text/plain",
    status: parsingQuality.level === "LOW" ? "LOW_QUALITY" : "SUCCESS",
    qualityScore: parsingQuality.score,
    textLength: rawText.length,
    warnings: parsingQuality.warnings,
    durationMs: Date.now() - startedAt,
  });
  recordFeatureEvent({
    userId,
    event: "resume_uploaded",
    metadata: {
      source: "paste",
      skillsCount: mergedSkills.length,
      qualityScore: parsingQuality.score,
    },
  });

  return created;
};

export const reanalyzeResumeService = async (
  userId: string,
  resumeId: string,
  overrideRawText?: string,
) => {
  const startedAt = Date.now();
  const existing = await getResumeById(resumeId, userId);
  if (!existing) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }

  const rawText = (overrideRawText?.trim() || existing.rawText || "").trim();
  if (rawText.replace(/\s/g, "").length < MIN_READABLE_CHARACTERS) {
    recordResumeParseAudit({
      userId,
      resumeId,
      mimeType: existing.mimeType,
      status: "FAILED",
      qualityScore: 0,
      textLength: rawText.length,
      warnings: ["NO_READABLE_TEXT"],
      durationMs: Date.now() - startedAt,
    });
    recordFeatureEvent({
      userId,
      event: "resume_parse_failed",
      metadata: { resumeId },
    });
    throw new AppError(
      422,
      "Stored resume text is too short to re-analyze. Paste full resume text first.",
      "NO_READABLE_TEXT",
    );
  }

  let analysis: ResumeAnalysis & { parseMode?: string };
  try {
    analysis = await analyzeResumeText(rawText, userId);
  } catch {
    analysis = buildDeterministicFallbackAnalysis(rawText);
  }

  const skills = cleanSkillList([
    ...analysis.skills,
    ...countSkillMentions(rawText).keys(),
  ]);
  const experienceYrs = clampExperienceYears(analysis.totalExperienceYears);
  const parsingQuality = computeResumeParsingQuality({
    rawText,
    skills,
    parsedData: analysis,
    fileSize: existing.fileSize,
  });

  const updated = await updateResumeForUser(resumeId, userId, {
    rawText,
    parsedData: { ...analysis, skills, parsingQuality },
    skills,
    experienceYrs,
  });

  if (!updated) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }

  recordResumeParseAudit({
    userId,
    resumeId,
    mimeType: existing.mimeType,
    status: parsingQuality.level === "LOW" ? "LOW_QUALITY" : "SUCCESS",
    qualityScore: parsingQuality.score,
    textLength: rawText.length,
    warnings: parsingQuality.warnings,
    durationMs: Date.now() - startedAt,
  });
  recordFeatureEvent({
    userId,
    event: "resume_reanalyzed",
    metadata: {
      resumeId,
      skillsCount: skills.length,
      qualityScore: parsingQuality.score,
    },
  });

  return updated;
};

export interface UpdateResumeSectionsInput {
  title?: string;
  summary?: string;
  skills?: string[];
  totalExperienceYears?: number;
  experience?: ResumeAnalysis["experience"];
  projects?: ResumeAnalysis["projects"];
  education?: ResumeAnalysis["education"];
}

export const updateResumeSectionsService = async (
  userId: string,
  resumeId: string,
  input: UpdateResumeSectionsInput,
) => {
  const existing = await getResumeById(resumeId, userId);
  if (!existing) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }

  const currentParsed =
    (existing.parsedData as Partial<ResumeAnalysis> | null) ?? {};

  const skills =
    input.skills !== undefined ? cleanSkillList(input.skills) : existing.skills;

  const experienceYrs =
    input.totalExperienceYears !== undefined
      ? clampExperienceYears(Number(input.totalExperienceYears))
      : existing.experienceYrs;

  const nextParsedData = {
    summary:
      input.summary !== undefined
        ? input.summary.trim()
        : (currentParsed.summary ?? ""),
    skills,
    experience:
      input.experience !== undefined
        ? input.experience
        : (currentParsed.experience ?? []),
    projects:
      input.projects !== undefined
        ? input.projects
        : (currentParsed.projects ?? []),
    education:
      input.education !== undefined
        ? input.education
        : (currentParsed.education ?? []),
    totalExperienceYears: experienceYrs,
    parseMode: "USER_VERIFIED",
  };

  const parsingQuality = computeResumeParsingQuality({
    rawText: existing.rawText,
    skills,
    parsedData: nextParsedData,
    fileSize: existing.fileSize,
  });

  const updated = await updateResumeForUser(resumeId, userId, {
    ...(input.title?.trim()
      ? { title: input.title.trim().slice(0, MAX_TITLE_LENGTH) }
      : {}),
    parsedData: { ...nextParsedData, parsingQuality },
    skills,
    experienceYrs,
  });

  if (!updated) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }
  return updated;
};
