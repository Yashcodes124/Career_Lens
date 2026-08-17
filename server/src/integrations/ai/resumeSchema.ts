import { z } from "zod";

export const resumeAnalysisSchema = z.object({
  summary: z.string(),
  skills: z.array(z.string()),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      field: z.string(),
      startYear: z.number().nullable(),
      endYear: z.number().nullable(),
    }),
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      description: z.string(),
      durationMonths: z.number().nullable(),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
    }),
  ),
  totalExperienceYears: z.number(),
});

export type ResumeAnalysis = z.infer<typeof resumeAnalysisSchema>;
