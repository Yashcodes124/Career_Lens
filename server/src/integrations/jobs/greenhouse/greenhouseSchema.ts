//src\integrations\jobs\greenhouse\greenhouseSchema.ts

import { z } from "zod";

const greenhouseJobSchema = z.object({
  id: z.number(),
  internal_job_id: z.number().nullable().optional(),
  title: z.string(),
  updated_at: z.string(),
  location: z
    .object({
      name: z.string(),
    })
    .nullable()
    .optional(),
  absolute_url: z.string().url(),
  content: z.string().optional(),
  departments: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        child_ids: z.array(z.number()).optional(),
      }),
    )
    .optional(),
});

export const greenhouseJobsResponseSchema = z.object({
  jobs: z.array(greenhouseJobSchema),
  meta: z
    .object({
      total: z.number(),
    })
    .optional(),
});

export type GreenhouseJob = z.infer<typeof greenhouseJobSchema>;
export type GreenhouseJobsResponse = z.infer<
  typeof greenhouseJobsResponseSchema
>;
