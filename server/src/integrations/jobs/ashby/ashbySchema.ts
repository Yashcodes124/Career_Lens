import { z } from "zod";

export const ashbyJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  department: z.string().optional().nullable(),
  team: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  isRemote: z.boolean().optional().nullable(),
  descriptionHtml: z.string().optional().nullable(),
  descriptionPlain: z.string().optional().nullable(),
  jobUrl: z.string().url().optional().nullable(),
  compensationTierSummary: z.string().optional().nullable(),
});

export const ashbyJobsResponseSchema = z.object({
  jobs: z.array(ashbyJobSchema).default([]),
});

export type AshbyJob = z.infer<typeof ashbyJobSchema>;
export type AshbyJobsResponse = z.infer<typeof ashbyJobsResponseSchema>;
