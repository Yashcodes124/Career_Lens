import { z } from "zod";

export const leverJobSchema = z.object({
  id: z.string(),
  text: z.string(),
  hostedUrl: z.string().url().optional().nullable(),
  descriptionPlain: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  additionalPlain: z.string().optional().nullable(),
  categories: z
    .object({
      location: z.string().optional().nullable(),
      team: z.string().optional().nullable(),
      department: z.string().optional().nullable(),
      commitment: z.string().optional().nullable(),
      allLocations: z.array(z.string()).optional(),
    })
    .optional()
    .nullable(),
  lists: z
    .array(
      z.object({
        text: z.string().optional(),
        content: z.string().optional(),
      }),
    )
    .optional()
    .nullable(),
  salaryRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().optional(),
      interval: z.string().optional(),
    })
    .optional()
    .nullable(),
});

export const leverJobsResponseSchema = z.array(leverJobSchema);

export type LeverJob = z.infer<typeof leverJobSchema>;
