import type { AshbyJob } from "./ashbySchema";
import {
  CanonicalJob,
  cleanJobDescription,
} from "../greenhouse/greenhouseAdapter";
import { extractJobSkills } from "../../../services/matching/jobSkillExtractor";

export const adaptAshbyJob = (job: AshbyJob, company: string): CanonicalJob => {
  const rawText = job.descriptionPlain || job.descriptionHtml || "";
  const plainTextDescription = cleanJobDescription(rawText);

  const location = job.location || (job.isRemote ? "Remote" : "India / Remote");

  return {
    externalId: `ashby-${job.id}`,
    source: "ASHBY",
    title: job.title,
    company,
    location,
    description: plainTextDescription,
    requirements: extractJobSkills(`${job.title}\n${plainTextDescription}`),
    salaryRange: job.compensationTierSummary ?? null,
    url: job.jobUrl ?? null,
  };
};

export const adaptAshbyJobs = (
  jobs: AshbyJob[],
  company: string,
): CanonicalJob[] => {
  return jobs.map((job) => adaptAshbyJob(job, company));
};
