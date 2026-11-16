export interface ParsedEducation {
  institution: string;
  degree: string;
  field: string;
  startYear: number | null;
  endYear: number | null;
}

export interface ParsedExperience {
  company: string;
  role: string;
  description: string;
  durationMonths: number | null;
}

export interface ParsedProject {
  name: string;
  description: string;
  technologies: string[];
}

export interface ParsedResumeData {
  summary: string;
  skills: string[];
  education: ParsedEducation[];
  experience: ParsedExperience[];
  projects: ParsedProject[];
  totalExperienceYears: number;
  parsingQuality?: ResumeParsingQuality;
}

export interface ResumeSummary {
  id: string;
  title: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  rawText?: string;
  skills: string[];
  experienceYrs: number;
  parsedData: ParsedResumeData | null;
  createdAt: string;
  updatedAt: string;
}
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

export function evaluateResumeParsingQuality(
  resume: ResumeSummary,
): ResumeParsingQuality {
  const existing = (
    resume.parsedData as
      | (ParsedResumeData & {
          parsingQuality?: ResumeParsingQuality;
          parseMode?: string;
        })
      | null
  )?.parsingQuality;
  if (existing && typeof existing.score === "number") {
    return existing;
  }

  const text = (resume.rawText ?? "").trim();
  const charCount = text.replace(/\s/g, "").length;
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const skills = resume.skills ?? resume.parsedData?.skills ?? [];
  const experience = resume.parsedData?.experience ?? [];
  const projects = resume.parsedData?.projects ?? [];
  const education = resume.parsedData?.education ?? [];
  const parseMode = (resume.parsedData as { parseMode?: string } | null)
    ?.parseMode;

  const warnings: ResumeParsingWarning[] = [];
  let score = 100;

  const isLargeFileWithTinyText =
    (resume.fileSize ?? 0) > 150_000 && charCount > 0 && charCount < 450;
  if (isLargeFileWithTinyText || (charCount > 0 && charCount < 250)) {
    score -= 35;
    warnings.push({
      code: "SCANNED_OR_LOW_TEXT",
      severity: "danger",
      title: "Low text extraction (possible scanned PDF)",
      detail:
        "Very little selectable text was extracted. Use Re-analyze or Paste Resume Text if sections are incomplete.",
    });
  }

  if (text) {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const pipeOrTabLines = lines.filter(
      (l) => /[|\t]/.test(l) || /\s{5,}/.test(l),
    ).length;
    const shortLines = lines.filter(
      (l) => l.length > 0 && l.length < 18,
    ).length;
    if (
      lines.length >= 12 &&
      (pipeOrTabLines >= 4 || shortLines / lines.length > 0.55)
    ) {
      score -= 18;
      warnings.push({
        code: "TABLE_OR_COLUMN_LAYOUT",
        severity: "warning",
        title: "Multi-column or table layout detected",
        detail:
          "Multi-column PDFs or tables can merge adjacent lines. Check your Experience and Projects sections.",
      });
    }
  }

  if (experience.length === 0) {
    score -= 20;
    warnings.push({
      code: "MISSING_EXPERIENCE",
      severity: "warning",
      title: "Missing structured work experience",
      detail:
        "No experience entries were extracted. Click Edit Sections to add your work or internship history.",
    });
  }

  if (projects.length === 0) {
    score -= 10;
    warnings.push({
      code: "MISSING_PROJECTS",
      severity: "info",
      title: "No structured projects detected",
      detail:
        "Add key engineering projects in Edit Sections to strengthen claim verification.",
    });
  }

  if (parseMode === "DETERMINISTIC_FALLBACK") {
    score -= 20;
    warnings.push({
      code: "AI_FALLBACK_USED",
      severity: "warning",
      title: "AI structure parser degraded — deterministic recovery used",
      detail:
        "AI could not structure all sections, so skills were recovered deterministically. Click Re-analyze or Edit Sections.",
    });
  }

  if (skills.length === 0) {
    score -= 25;
    warnings.push({
      code: "NO_TECHNICAL_SKILLS",
      severity: "danger",
      title: "No relevant technical skills detected",
      detail:
        "This resume was parsed, but lists 0 recognized technical skills. Add your stack in the Skills tab.",
    });
  }

  const finalScore = Math.max(15, Math.min(100, score));
  const level: "HIGH" | "MEDIUM" | "LOW" =
    finalScore >= 80 ? "HIGH" : finalScore >= 55 ? "MEDIUM" : "LOW";

  let outcome: ResumeParsingQuality["outcome"] = "PARSED_CLEAN";
  let outcomeSummary =
    "AI parsed document structure and extracted technical skills cleanly.";

  if (
    parseMode === "DETERMINISTIC_FALLBACK" ||
    (experience.length === 0 && projects.length === 0 && education.length === 0)
  ) {
    outcome = "AI_PARSE_DEGRADED";
    outcomeSummary =
      "AI could not parse full section structure from this layout — recovered via deterministic scan.";
  } else if (skills.length === 0) {
    outcome = "NO_RELEVANT_SKILLS";
    outcomeSummary =
      "Resume text was read clearly, but contains no recognized technical skills.";
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
}
