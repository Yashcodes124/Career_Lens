import "dotenv/config";
import OpenAI from "openai";
import { AppError } from "../../utils/appError";
import { parseModelJson } from "../../utils/parseModelJson";

const DEFAULT_MODEL = "meta/llama-3.1-70b-instruct";
const FALLBACK_FAST_MODEL = "meta/llama-3.1-70b-instruct";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const REQUEST_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 45_000;

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

const callCompletion = async (model: string, prompt: string) => {
  return await getClient().chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a fast, deterministic JSON API. Return ONLY raw valid JSON with no markdown blocks, no <think> tags, and no prose.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 2500,
  });
};

export const analyzeResumeWithNvidia = async (
  prompt: string,
): Promise<unknown> => {
  const primaryModel =
    process.env.NVIDIA_MODEL || process.env.AI_MODEL || DEFAULT_MODEL;

  let content: string | null | undefined;
  try {
    const response = await callCompletion(primaryModel, prompt);
    content = response.choices[0]?.message?.content;
  } catch (primaryError) {
    if (primaryError instanceof AppError) throw primaryError;

    // If a heavy reasoning model timed out in dev/prod, fallback once to fast Llama 70B
    const isTestEnv = process.env.NODE_ENV === "test";
    if (!isTestEnv && primaryModel !== FALLBACK_FAST_MODEL) {
      try {
        console.warn(
          `[AI Client] Model "${primaryModel}" timed out or failed. Retrying with fast model "${FALLBACK_FAST_MODEL}"...`,
        );
        const fallbackResponse = await callCompletion(
          FALLBACK_FAST_MODEL,
          prompt,
        );
        content = fallbackResponse.choices[0]?.message?.content;
      } catch (fallbackError) {
        console.error(
          "NVIDIA fallback request failed:",
          fallbackError instanceof Error
            ? fallbackError.message
            : "unknown error",
        );
        throw new AppError(
          503,
          "AI service is temporarily unavailable. Please try again.",
          "AI_UNAVAILABLE",
        );
      }
    } else {
      console.error(
        "NVIDIA request failed:",
        primaryError instanceof Error ? primaryError.message : "unknown error",
      );
      throw new AppError(
        503,
        "Resume analysis is temporarily unavailable. Please try again.",
        "AI_UNAVAILABLE",
      );
    }
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
