import "dotenv/config";
import OpenAI from "openai";
import { AppError } from "../../utils/appError";
import { parseModelJson } from "../../utils/parseModelJson";
import { sanitizeProviderError, type AiTokenUsage } from "./aiTelemetry";

export type GroqTaskTier = "default" | "fast" | "evaluation";

export interface ProviderRawResult {
  content: string;
  model: string;
  usage: AiTokenUsage;
}

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "qwen/qwen3.8-27b";
const DEFAULT_FAST_MODEL = "openai/gpt-oss-20b";
const DEFAULT_EVALUATION_MODEL = "openai/gpt-oss-120b";

let cachedClient: OpenAI | null = null;
let cachedKey = "";
let cachedBaseUrl = "";

export const isGroqConfigured = (): boolean =>
  Boolean(process.env.GROQ_API_KEY || process.env.AI_API_KEY);

const getClient = (): OpenAI => {
  const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      503,
      "AI service is not configured yet",
      "AI_NOT_CONFIGURED",
    );
  }

  const baseURL =
    process.env.GROQ_BASE_URL ||
    (process.env.AI_BASE_URL?.includes("groq.com")
      ? process.env.AI_BASE_URL
      : DEFAULT_BASE_URL);

  const timeout = Number(process.env.AI_TIMEOUT_MS) || 45_000;

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

export const callGroqCompletion = async (
  prompt: string,
  tier: GroqTaskTier = "default",
): Promise<ProviderRawResult> => {
  const primaryModel = resolveGroqModel(tier);
  const fastFallbackModel = process.env.GROQ_FAST_MODEL || DEFAULT_FAST_MODEL;

  const modelsToTry =
    primaryModel !== fastFallbackModel && process.env.NODE_ENV !== "test"
      ? [primaryModel, fastFallbackModel]
      : [primaryModel];

  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const response = await getClient().chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 8192,
      });
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AppError(
          502,
          "AI returned an empty response.",
          "AI_INVALID_OUTPUT",
        );
      }
      return {
        content,
        model,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      const safeErr = sanitizeProviderError(error);
      lastError = safeErr;
      // Do not retry another model on rate limit or auth config error
      if (
        safeErr.code === "AI_RATE_LIMITED" ||
        safeErr.code === "AI_NOT_CONFIGURED"
      ) {
        throw safeErr;
      }
      console.warn(
        `[Groq] Attempt failed (model=${model}, code=${safeErr.code})`,
      );
    }
  }

  throw sanitizeProviderError(lastError);
};

export const analyzeResumeWithGroq = async (
  prompt: string,
  tier: GroqTaskTier = "default",
): Promise<unknown> => {
  const raw = await callGroqCompletion(prompt, tier);
  try {
    return parseModelJson(raw.content);
  } catch {
    throw new AppError(
      502,
      "AI returned unreadable structured output.",
      "AI_INVALID_OUTPUT",
    );
  }
};
