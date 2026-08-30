//  src/integrations/jobs/greenhouse/greenhouseAdapter.ts;

//CanonicalJob: refers to  std-template the application follows for different platforms

import type { GreenhouseJob } from "./greenhouseSchema";
import { extractJobSkills } from "../../../services/matching/jobSkillExtractor";

//Standard template
export type CanonicalJob = {
  externalId: string;
  source: string;
  title: string;
  company: string;
  location: string | null;
  description: string;
  requirements: string[];
  salaryRange: string | null;
  url: string | null;
};

const cleanJobDescription = (rawContent: string): string => {
  return rawContent
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
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
    requirements: extractJobSkills(plainTextDescription),
    salaryRange: null,
    url: job.absolute_url,
  };
};

//Green house adaptor
export const adaptGreenhouseJobs = (
  jobs: GreenhouseJob[],
  company: string,
): CanonicalJob[] => {
  return jobs.map((job) => adaptGreenhouseJob(job, company));
};
