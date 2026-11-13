import "dotenv/config";
import OpenAI from "openai";
import { AppError } from "../../utils/appError";
import { parseModelJson } from "../../utils/parseModelJson";

const DEFAULT_BASE_URL = "http://localhost:11434/v1";
const DEFAULT_MODEL = "qwen3:4b";

let cachedClient: OpenAI | null = null;
let cachedBaseUrl = "";

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
  const timeout = Number(process.env.AI_TIMEOUT_MS) || 90_000;

  if (!cachedClient || cachedBaseUrl !== baseURL) {
    cachedClient = new OpenAI({
      apiKey: "ollama", // Required by OpenAI SDK constructor; ignored by local Ollama server
      baseURL,
      timeout,
      maxRetries: 0,
    });
    cachedBaseUrl = baseURL;
  }

  return cachedClient;
};

export const analyzeResumeWithOllama = async (
  prompt: string,
): Promise<unknown> => {
  const model =
    process.env.OLLAMA_MODEL || process.env.AI_MODEL || DEFAULT_MODEL;

  let content: string | null | undefined;
  try {
    const response = await getClient().chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });
    content = response.choices[0]?.message?.content;
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error(
      "Ollama request failed:",
      error instanceof Error ? error.message : "unknown error",
    );
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
