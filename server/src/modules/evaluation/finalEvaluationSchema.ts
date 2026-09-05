import { z } from "zod";

//===================== Final Evaluation schema for summary ============================

export const FinalEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(1),
  breakdown: z.object({
    communication: z.number().min(0).max(100),
    technicalKnowledge: z.number().min(0).max(100),
    problemSolving: z.number().min(0).max(100),
    relevance: z.number().min(0).max(100),
    confidance: z.number().min(0).max(100),
  }),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  recommendation: z.string().min(1),
});

export type FinalEvaluation = z.infer<typeof FinalEvaluationSchema>;
