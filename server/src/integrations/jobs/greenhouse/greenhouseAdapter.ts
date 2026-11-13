import type { JobSource } from "@prisma/client";
import type { GreenhouseJob } from "./greenhouseSchema";
import { extractJobSkills } from "../../../services/matching/jobSkillExtractor";

export type CanonicalJob = {
  externalId: string;
  source: JobSource;
  title: string;
  company: string;
  location: string | null;
  description: string;
  requirements: string[];
  salaryRange: string | null;
  url: string | null;
};

export const cleanJobDescription = (rawContent: string): string => {
  return rawContent
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const adaptGreenhouseJob = (
  job: GreenhouseJob,
  company: string,
): CanonicalJob => {
  const plainTextDescription = cleanJobDescription(job.content ?? "");
  return {
    externalId: String(job.id),
    source: "GREENHOUSE",
    title: job.title,
    company,
    location: job.location?.name ?? null,
    description: plainTextDescription,
    requirements: extractJobSkills(`${job.title}\n${plainTextDescription}`),
    salaryRange: null,
    url: job.absolute_url,
  };
};

export const adaptGreenhouseJobs = (
  jobs: GreenhouseJob[],
  company: string,
): CanonicalJob[] => {
  return jobs.map((job) => adaptGreenhouseJob(job, company));
};
