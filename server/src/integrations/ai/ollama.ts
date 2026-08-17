import ollama from "ollama";
import { resumeAnalysisSchema, type ResumeAnalysis } from "./resumeSchema";

export const analyzeResume = async (
  prompt: string,
): Promise<ResumeAnalysis> => {
  const response = await ollama.chat({
    model: "qwen3:8b",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    format: "json",
  });

  const parsed = JSON.parse(response.message.content);

  return resumeAnalysisSchema.parse(parsed);
};
