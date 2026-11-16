import { z } from "zod";
import {
  callGroqCompletion,
  isGroqConfigured,
  type GroqTaskTier,
  type ProviderRawResult,
} from "./groqClient";
import { callNvidiaCompletion, isNvidiaConfigured } from "./nvidiaClient";
import { callGeminiCompletion, isGeminiConfigured } from "./geminiClient";
import { callOllamaCompletion, isOllamaConfigured } from "./ollamaClient";
import { parseModelJson } from "../../utils/parseModelJson";
import { AppError } from "../../utils/appError";
import {
  recordAiAudit,
  sanitizeProviderError,
  type AiFeatureName,
} from "./aiTelemetry";

export type AiProviderName = "groq" | "nvidia" | "gemini" | "ollama";

export interface AiRequestContext {
  userId?: string;
  feature?: AiFeatureName;
  schema?: z.ZodTypeAny;
}

const resolvePrimaryProvider = (): AiProviderName => {
  const raw = (process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (
    raw === "groq" ||
    raw === "nvidia" ||
    raw === "gemini" ||
    raw === "ollama"
  ) {
    return raw;
  }

  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.NVIDIA_API_KEY) return "nvidia";
  return "groq";
};

const isProviderAvailable = (provider: AiProviderName): boolean => {
  switch (provider) {
    case "groq":
      return isGroqConfigured();
    case "nvidia":
      return isNvidiaConfigured();
    case "gemini":
      return isGeminiConfigured();
    case "ollama":
      return isOllamaConfigured();
  }
};

/**
 * Builds the primary -> secondary provider failover chain.
 * Only includes secondary providers that actually have credentials/endpoints configured.
 */
const buildProviderChain = (primary: AiProviderName): AiProviderName[] => {
  if (process.env.NODE_ENV === "test") {
    return [primary];
  }

  const allProviders: AiProviderName[] = ["groq", "nvidia", "gemini", "ollama"];
  const chain: AiProviderName[] = [primary];

  for (const candidate of allProviders) {
    if (candidate !== primary && isProviderAvailable(candidate)) {
      chain.push(candidate);
    }
  }

  return chain;
};

const invokeProvider = async (
  provider: AiProviderName,
  prompt: string,
  tier: GroqTaskTier,
): Promise<ProviderRawResult> => {
  switch (provider) {
    case "groq":
      return await callGroqCompletion(prompt, tier);
    case "nvidia":
      return await callNvidiaCompletion(prompt);
    case "gemini":
      return await callGeminiCompletion(prompt);
    case "ollama":
      return await callOllamaCompletion(prompt);
  }
};

const parseAndValidateStructured = (
  rawContent: string,
  schema?: z.ZodTypeAny,
): unknown => {
  const parsed = parseModelJson(rawContent);
  if (schema) {
    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      throw new AppError(
        502,
        "AI output failed structured schema validation.",
        "AI_INVALID_OUTPUT",
      );
    }
    return validated.data;
  }
  return parsed;
};

export const analyzeResume = async (
  prompt: string,
  tier: GroqTaskTier = "default",
  context?: AiRequestContext,
): Promise<unknown> => {
  const primary = resolvePrimaryProvider();
  const chain = buildProviderChain(primary);
  const userId = context?.userId ?? "system";
  const feature: AiFeatureName = context?.feature ?? "GENERAL";

  let lastSanitizedError: AppError | null = null;

  for (let idx = 0; idx < chain.length; idx++) {
    const provider = chain[idx];
    const fallbackUsed = idx > 0;
    const startedAt = Date.now();

    try {
      const raw = await invokeProvider(provider, prompt, tier);

      try {
        const validated = parseAndValidateStructured(
          raw.content,
          context?.schema,
        );

        recordAiAudit({
          userId,
          feature,
          provider,
          model: raw.model,
          latencyMs: Date.now() - startedAt,
          status: "SUCCESS",
          promptTokens: raw.usage.promptTokens,
          completionTokens: raw.usage.completionTokens,
          totalTokens: raw.usage.totalTokens,
          fallbackUsed,
        });

        return validated;
      } catch {
        // Controlled 1-retry for malformed JSON or schema mismatch on the active provider
        const repairPrompt = `${prompt}\n\nIMPORTANT: Your previous response was not valid raw JSON matching the required schema. Return ONLY valid raw JSON with no markdown code fences or prose.`;
        const retryRaw = await invokeProvider(provider, repairPrompt, tier);
        const retryValidated = parseAndValidateStructured(
          retryRaw.content,
          context?.schema,
        );

        recordAiAudit({
          userId,
          feature,
          provider,
          model: retryRaw.model,
          latencyMs: Date.now() - startedAt,
          status: "SUCCESS",
          promptTokens: raw.usage.promptTokens + retryRaw.usage.promptTokens,
          completionTokens:
            raw.usage.completionTokens + retryRaw.usage.completionTokens,
          totalTokens: raw.usage.totalTokens + retryRaw.usage.totalTokens,
          fallbackUsed,
        });

        return retryValidated;
      }
    } catch (err) {
      const safeErr = sanitizeProviderError(err);
      lastSanitizedError = safeErr;

      recordAiAudit({
        userId,
        feature,
        provider,
        model: "unknown",
        latencyMs: Date.now() - startedAt,
        status: "FAILURE",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        fallbackUsed,
        errorCode: safeErr.code,
      });

      // Continue to secondary provider if available
      if (idx < chain.length - 1) {
        console.warn(
          `[AI Failover] Primary provider "${provider}" failed (${safeErr.code}). Failing over to "${chain[idx + 1]}"...`,
        );
      }
    }
  }

  throw (
    lastSanitizedError ??
    new AppError(
      503,
      "AI analysis service is temporarily unavailable.",
      "AI_UNAVAILABLE",
    )
  );
};
