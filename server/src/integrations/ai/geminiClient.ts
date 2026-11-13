import "dotenv/config";
import OpenAI from "openai";
import { AppError } from "../../utils/appError";
import { parseModelJson } from "../../utils/parseModelJson";

const DEFAULT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";
const DEFAULT_MODEL = "gemini-flash-latest";

let cachedClient: OpenAI | null = null;
let cachedKey = "";
let cachedBaseUrl = "";

const getClient = (): OpenAI => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      503,
      "Resume analysis is not configured yet",
      "AI_NOT_CONFIGURED",
    );
  }

  const baseURL =
    process.env.GEMINI_BASE_URL ||
    (process.env.AI_BASE_URL?.includes("googleapis.com")
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

export const analyzeResumeWithGemini = async (
  prompt: string,
): Promise<unknown> => {
  const model =
    process.env.GEMINI_MODEL || process.env.AI_MODEL || DEFAULT_MODEL;

  let content: string | null | undefined;
  try {
    const response = await getClient().chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 8192,
    });
    content = response.choices[0]?.message?.content;
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.error(
      "Gemini request failed:",
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
