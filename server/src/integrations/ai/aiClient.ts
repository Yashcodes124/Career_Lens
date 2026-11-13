import { analyzeResumeWithGroq, GroqTaskTier } from "./groqClient";
import { analyzeResumeWithNvidia } from "./nvidiaClient";
import { analyzeResumeWithGemini } from "./geminiClient";
import { analyzeResumeWithOllama } from "./ollamaClient";

export type AiProviderName = "groq" | "nvidia" | "gemini" | "ollama";

const resolveProvider = (): AiProviderName => {
  const raw = (process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (
    raw === "groq" ||
    raw === "nvidia" ||
    raw === "gemini" ||
    raw === "ollama"
  ) {
    return raw;
  }

  // Fallback inference if AI_PROVIDER is unset
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.NVIDIA_API_KEY) return "nvidia";
  return "groq";
};

export const analyzeResume = async (
  prompt: string,
  tier: GroqTaskTier = "default",
): Promise<unknown> => {
  const provider = resolveProvider();

  switch (provider) {
    case "groq":
      return await analyzeResumeWithGroq(prompt, tier);
    case "nvidia":
      return await analyzeResumeWithNvidia(prompt);
    case "gemini":
      return await analyzeResumeWithGemini(prompt);
    case "ollama":
      return await analyzeResumeWithOllama(prompt);
    default:
      return await analyzeResumeWithGroq(prompt, tier);
  }
};
