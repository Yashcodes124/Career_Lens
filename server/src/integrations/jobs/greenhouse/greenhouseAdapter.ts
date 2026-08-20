//  src/integrations/jobs/greenhouse/greenhouseAdapter.ts;

//CanonicalJob: refers to  std-template the application follows for different platforms

import type { GreenhouseJob } from "./greenhouseSchema";

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

export const adaptGreenhouseJob = (
  job: GreenhouseJob,
  company: string,
): CanonicalJob => {
  return {
    externalId: String(job.id),
    source: "GREENHOUSE",
    title: job.title,
    company,
    location: job.location?.name ?? null,
    description: job.content ?? "",
    requirements: [],
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
