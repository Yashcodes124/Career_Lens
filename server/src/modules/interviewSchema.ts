//server/src/modules/interview/interview.schema.ts

import { runOnce } from "vitest";
import { z } from "zod";

export const InterviewRoundSchema = z.object({
  name: z.string().min(1, "Round name is required"),
  duration: z.number().positive("Duration must be a positive number"),
});

export const InterviewPlanSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role is required"),
  matchScore: z.number().min(0).max(100),
  topSkillGaps: z.array(z.string()),
  estimatedDuration: z.number().positive(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  targetSkills: z.array(z.string()),
  rounds: z
    .array(InterviewRoundSchema)
    .min(1, "At least one round is required"),
});

export type InterviewRound = z.infer<typeof InterviewRoundSchema>;
export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;

export const InterviewQuestionSchema = z.object({
  round: z.string().min(1, "Round name cannot be empty"),
  question: z.string().min(1, "Question text cannot be empty"),
  order: z.number().int().positive("Order must be a positive integer"),
});

export const InterviewQuestionsSchema = z.object({
  questions: z
    .array(InterviewQuestionSchema)
    .min(1, "At least one question is required"),
});

export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type InterviewQuestions = z.infer<typeof InterviewQuestionsSchema>;
