// server/src/integrations/ai/aiClient.ts

import { analyzeResumeWithNvidia } from "./nvidiaClient";

export const analyzeResume = async (prompt: string) => {
  return await analyzeResumeWithNvidia(prompt);
};