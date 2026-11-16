import "dotenv/config";
import OpenAI from "openai";
import { AppError } from "../../utils/appError";
import { parseModelJson } from "../../utils/parseModelJson";
import { sanitizeProviderError } from "./aiTelemetry";
import type { ProviderRawResult } from "./groqClient";

const DEFAULT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";
const DEFAULT_MODEL = "gemini-flash-latest";

let cachedClient: OpenAI | null = null;
let cachedKey = "";
let cachedBaseUrl = "";

export const isGeminiConfigured = (): boolean =>
  Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY);

const getClient = (): OpenAI => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      503,
      "AI service is not configured yet",
      "AI_NOT_CONFIGURED",
    );
  }

  const baseURL =
    process.env.GEMINI_BASE_URL ||
    (process.env.AI_BASE_URL?.includes("googleapis.com")
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

export const callGeminiCompletion = async (
  prompt: string,
): Promise<ProviderRawResult> => {
  const model =
    process.env.GEMINI_MODEL || process.env.AI_MODEL || DEFAULT_MODEL;

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
    throw sanitizeProviderError(error);
  }
};

export const analyzeResumeWithGemini = async (
  prompt: string,
): Promise<unknown> => {
  const raw = await callGeminiCompletion(prompt);
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
