import "dotenv/config";
import OpenAI from "openai";
import { AppError } from "../../utils/appError";
import { parseModelJson } from "../../utils/parseModelJson";
import { sanitizeProviderError } from "./aiTelemetry";
import type { ProviderRawResult } from "./groqClient";

const DEFAULT_MODEL = "nvidia/nemotron-3.5-super-vl-120b-a12b";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";

let cachedClient: OpenAI | null = null;
let cachedKey = "";
let cachedBaseUrl = "";

export const isNvidiaConfigured = (): boolean =>
  Boolean(process.env.NVIDIA_API_KEY || process.env.AI_API_KEY);

const getClient = (): OpenAI => {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      503,
      "AI service is not configured yet",
      "AI_NOT_CONFIGURED",
    );
  }

  const baseURL =
    process.env.NVIDIA_BASE_URL ||
    (process.env.AI_BASE_URL?.includes("nvidia.com")
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

export const callNvidiaCompletion = async (
  prompt: string,
): Promise<ProviderRawResult> => {
  const model =
    process.env.NVIDIA_MODEL || process.env.AI_MODEL || DEFAULT_MODEL;

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

export const analyzeResumeWithNvidia = async (
  prompt: string,
): Promise<unknown> => {
  const raw = await callNvidiaCompletion(prompt);
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
