//server/src/modules/interview/interview.service.ts

import { analyzeResume } from "../integrations/ai/aiClient";
import {
  buildInterviewPlanPrompt,
  InterviewPromptInput,
} from "./interview.prompt";
import { InterviewPlanSchema, InterviewPlan } from "./interview.schema";

export const generateInterviewPlan = async (
  input: InterviewPromptInput,
): Promise<InterviewPlan> => {
  // 1. Build prompt
  const prompt = buildInterviewPlanPrompt(input);

  // 2. Call existing AI client abstraction
  const rawResponse = await analyzeResume(prompt);

  // 3. Handle JSON parsing (if analyzeResume returned string instead of parsed object)
  const jsonContent =
    typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;

  // 4. Validate output with InterviewPlanSchema
  const validatedPlan = InterviewPlanSchema.parse(jsonContent);

  return validatedPlan;
};
