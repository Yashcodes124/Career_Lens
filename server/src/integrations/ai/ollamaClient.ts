import "dotenv/config";
import OpenAI from "openai";
import { AppError } from "../../utils/appError";
import { parseModelJson } from "../../utils/parseModelJson";
import { sanitizeProviderError } from "./aiTelemetry";
import type { ProviderRawResult } from "./groqClient";

const DEFAULT_BASE_URL = "http://localhost:11434/v1";
const DEFAULT_MODEL = "qwen3:4b";

let cachedClient: OpenAI | null = null;
let cachedBaseUrl = "";

export const isOllamaConfigured = (): boolean =>
  Boolean(process.env.OLLAMA_BASE_URL || process.env.AI_PROVIDER === "ollama");

const normalizeOllamaBaseUrl = (rawUrl?: string): string => {
  if (!rawUrl) return DEFAULT_BASE_URL;
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
};

const getClient = (): OpenAI => {
  const baseURL = normalizeOllamaBaseUrl(
    process.env.OLLAMA_BASE_URL ||
      (process.env.AI_BASE_URL?.includes("11434")
        ? process.env.AI_BASE_URL
        : undefined),
  );
  const timeout = Number(process.env.AI_TIMEOUT_MS) || 60_000;

  if (!cachedClient || cachedBaseUrl !== baseURL) {
    cachedClient = new OpenAI({
      apiKey: "ollama",
      baseURL,
      timeout,
      maxRetries: 0,
    });
    cachedBaseUrl = baseURL;
  }

  return cachedClient;
};

export const callOllamaCompletion = async (
  prompt: string,
): Promise<ProviderRawResult> => {
  const model =
    process.env.OLLAMA_MODEL || process.env.AI_MODEL || DEFAULT_MODEL;

  try {
    const response = await getClient().chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
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

export const analyzeResumeWithOllama = async (
  prompt: string,
): Promise<unknown> => {
  const raw = await callOllamaCompletion(prompt);
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
