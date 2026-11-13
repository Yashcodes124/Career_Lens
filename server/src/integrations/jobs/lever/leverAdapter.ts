import type { LeverJob } from "./leverSchema";
import {
  CanonicalJob,
  cleanJobDescription,
} from "../greenhouse/greenhouseAdapter";
import { extractJobSkills } from "../../../services/matching/jobSkillExtractor";

export const adaptLeverJob = (job: LeverJob, company: string): CanonicalJob => {
  const listContent = (job.lists ?? [])
    .map((item) => `${item.text ?? ""} ${item.content ?? ""}`)
    .join(" ");

  const rawBody = [
    job.descriptionPlain || job.description || "",
    listContent,
    job.additionalPlain || "",
  ].join(" ");

  const plainTextDescription = cleanJobDescription(rawBody);
  const location =
    job.categories?.location ||
    (job.categories?.allLocations?.length
      ? job.categories.allLocations.join(", ")
      : null);

  let salaryRange: string | null = null;
  if (job.salaryRange?.min && job.salaryRange?.max) {
    const currency = job.salaryRange.currency || "";
    salaryRange =
      `${currency} ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}`.trim();
  }

  return {
    externalId: `lever-${job.id}`,
    source: "LEVER",
    title: job.text,
    company,
    location,
    description: plainTextDescription,
    requirements: extractJobSkills(`${job.text}\n${plainTextDescription}`),
    salaryRange,
    url: job.hostedUrl ?? null,
  };
};

export const adaptLeverJobs = (
  jobs: LeverJob[],
  company: string,
): CanonicalJob[] => {
  return jobs.map((job) => adaptLeverJob(job, company));
};
