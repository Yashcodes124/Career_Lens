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
}

export interface ResumeSummary {
  id: string;
  title: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  skills: string[];
  experienceYrs: number;
  parsedData: ParsedResumeData | null;
  createdAt: string;
  updatedAt: string;
}
