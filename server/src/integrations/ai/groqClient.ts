import "dotenv/config";
import OpenAI from "openai";
import { AppError } from "../../utils/appError";
import { parseModelJson } from "../../utils/parseModelJson";

export type GroqTaskTier = "default" | "fast" | "evaluation";

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "qwen/qwen3.8-27b";
const DEFAULT_FAST_MODEL = "openai/gpt-oss-20b";
const DEFAULT_EVALUATION_MODEL = "openai/gpt-oss-120b";

let cachedClient: OpenAI | null = null;
let cachedKey = "";
let cachedBaseUrl = "";

const getClient = (): OpenAI => {
  const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      503,
      "Resume analysis is not configured yet",
      "AI_NOT_CONFIGURED",
    );
  }

  const baseURL =
    process.env.GROQ_BASE_URL ||
    (process.env.AI_BASE_URL?.includes("groq.com")
      ? process.env.AI_BASE_URL
      : DEFAULT_BASE_URL);

  const timeout = Number(process.env.AI_TIMEOUT_MS) || 60_000;

  if (!cachedClient || cachedKey !== apiKey || cachedBaseUrl !== baseURL) {
    cachedClient = new OpenAI({
      apiKey,
      baseURL,
      timeout,
      maxRetries: 1,
    });
    cachedKey = apiKey;
    cachedBaseUrl = baseURL;
  }

  return cachedClient;
};

const resolveGroqModel = (tier: GroqTaskTier = "default"): string => {
  if (tier === "fast") {
    return process.env.GROQ_FAST_MODEL || DEFAULT_FAST_MODEL;
  }
  if (tier === "evaluation") {
    return (
      process.env.GROQ_EVALUATION_MODEL ||
      process.env.GROQ_MODEL ||
      process.env.AI_MODEL ||
      DEFAULT_EVALUATION_MODEL
    );
  }
  return process.env.GROQ_MODEL || process.env.AI_MODEL || DEFAULT_MODEL;
};

export const analyzeResumeWithGroq = async (
  prompt: string,
  tier: GroqTaskTier = "default",
): Promise<unknown> => {
  const primaryModel = resolveGroqModel(tier);
  const fastFallbackModel = process.env.GROQ_FAST_MODEL || DEFAULT_FAST_MODEL;

  const modelsToTry =
    primaryModel !== fastFallbackModel && process.env.NODE_ENV !== "test"
      ? [primaryModel, fastFallbackModel]
      : [primaryModel];

  let content: string | null | undefined;
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const response = await getClient().chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 8192,
      });
      content = response.choices[0]?.message?.content;
      if (content) break;
    } catch (error) {
      if (error instanceof AppError) throw error;
      lastError = error;
      console.error(
        `Groq request failed (model=${model}):`,
        error instanceof Error ? error.message : "unknown error",
      );
    }
  }

  if (!content && lastError) {
    throw new AppError(
      503,
      "Resume analysis is temporarily unavailable. Please try again.",
      "AI_UNAVAILABLE",
    );
  }

  if (!content) {
    throw new AppError(
      502,
      "Resume analysis returned no result",
      "AI_INVALID_OUTPUT",
    );
  }

  try {
    return parseModelJson(content);
  } catch {
    throw new AppError(
      502,
      "Resume analysis returned unreadable output",
      "AI_INVALID_OUTPUT",
    );
  }
};
