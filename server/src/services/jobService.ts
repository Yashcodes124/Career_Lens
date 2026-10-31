import type { JobQuery } from "../utils/jobQuery";
import { getJobs, getJobById, upsertJob } from "../repositories/jobRepository";
import { extractJobSkills } from "./matching/jobSkillExtractor";
import { AppError } from "../utils/appError";

export const getJobsService = async (filters: JobQuery) => {
  return await getJobs(filters);
};

export const getJobByIdService = async (id: string) => {
  const job = await getJobById(id);

  if (!job) {
    throw new Error("Job not found");
  }

  return job;
};

export interface ImportExternalJobInput {
  title: string;
  company: string;
  location?: string;
  source?: string;
  url?: string;
  salaryRange?: string;
  description: string;
}

export const importExternalJobService = async (
  input: ImportExternalJobInput,
) => {
  const title = input.title?.trim();
  const company = input.company?.trim();
  const description = input.description?.trim();

  if (!title || !company || !description || description.length < 20) {
    throw new AppError(
      400,
      "Provide role title, company, and a complete job description (at least 20 characters).",
      "VALIDATION_ERROR",
    );
  }

  const source = (input.source || "LINKEDIN").trim().toUpperCase();
  const requirements = extractJobSkills(`${title}\n${description}`);

  return await upsertJob({
    externalId: `ext-${source.toLowerCase()}-${Date.now()}`,
    source,
    title,
    company,
    location: input.location?.trim() || "India / Remote",
    description,
    requirements,
    salaryRange: input.salaryRange?.trim() || null,
    url: input.url?.trim() || null,
  });
};
