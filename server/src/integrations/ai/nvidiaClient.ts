import "dotenv/config";
import OpenAI from "openai";
import { AppError } from "../../utils/appError";
import { parseModelJson } from "../../utils/parseModelJson";

const DEFAULT_MODEL = "nvidia/nemotron-3.5-super-vl-120b-a12b";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const REQUEST_TIMEOUT_MS = 90_000;

let cachedClient: OpenAI | null = null;
let cachedKey = "";
let cachedBaseUrl = "";

const getClient = (): OpenAI => {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      503,
      "Resume analysis is not configured yet",
      "AI_NOT_CONFIGURED",
    );
  }

  const baseURL = process.env.AI_BASE_URL || DEFAULT_BASE_URL;

  if (!cachedClient || cachedKey !== apiKey || cachedBaseUrl !== baseURL) {
    cachedClient = new OpenAI({
      apiKey,
      baseURL,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 1,
    });
    cachedKey = apiKey;
    cachedBaseUrl = baseURL;
  }

  return cachedClient;
};

export const analyzeResumeWithNvidia = async (
  prompt: string,
): Promise<unknown> => {
  const model =
    process.env.NVIDIA_MODEL || process.env.AI_MODEL || DEFAULT_MODEL;

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
      "NVIDIA request failed:",
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
