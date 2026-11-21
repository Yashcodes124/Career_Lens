import { AppError } from "../../utils/appError";
import prisma from "../../config/db";

export type AiFeatureName =
  | "RESUME_ANALYSIS"
  | "INTERVIEW_GENERATION"
  | "INTERVIEW_ANSWER_EVAL"
  | "INTERVIEW_FINAL_EVAL"
  | "GENERAL";

export interface AiTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiAuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  feature: AiFeatureName;
  provider: string;
  model: string;
  latencyMs: number;
  status: "SUCCESS" | "FAILURE";
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  fallbackUsed: boolean;
  errorCode?: string;
}

export interface AiUsageBucket {
  requests: number;
  successes: number;
  failures: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

// Approximate blended token rates ($ per 1M tokens) for cost observability
const MODEL_COST_PER_1M: Record<string, { input: number; output: number }> = {
  "qwen/qwen3.8-27b": { input: 0.2, output: 0.4 },
  "openai/gpt-oss-20b": { input: 0.1, output: 0.2 },
  "openai/gpt-oss-120b": { input: 0.4, output: 0.8 },
  "gemini-flash-latest": { input: 0.1, output: 0.4 },
  "nvidia/nemotron-3.5-super-vl-120b-a12b": { input: 0.35, output: 0.7 },
  "nvidia/nemotron-3-ultra-550b-a55b": { input: 0.6, output: 1.2 },
  "qwen3:4b": { input: 0, output: 0 },
};

const MAX_AUDIT_LOGS = 250;
const MAX_TRACKED_USERS = 500;
const auditLogs: AiAuditEntry[] = [];
const usageByUser = new Map<string, AiUsageBucket>();
const usageByFeature = new Map<AiFeatureName, AiUsageBucket>();

const createEmptyBucket = (): AiUsageBucket => ({
  requests: 0,
  successes: 0,
  failures: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  estimatedCostUsd: 0,
});

export const estimateAiCostUsd = (
  model: string,
  usage?: Partial<AiTokenUsage>,
): number => {
  if (!usage) return 0;
  const rates = MODEL_COST_PER_1M[model] ?? { input: 0.25, output: 0.5 };
  const promptCost = ((usage.promptTokens ?? 0) / 1_000_000) * rates.input;
  const completionCost =
    ((usage.completionTokens ?? 0) / 1_000_000) * rates.output;
  return Number((promptCost + completionCost).toFixed(6));
};

export const recordAiAudit = (
  entry: Omit<AiAuditEntry, "id" | "timestamp" | "estimatedCostUsd">,
): AiAuditEntry => {
  const estimatedCostUsd = estimateAiCostUsd(entry.model, {
    promptTokens: entry.promptTokens,
    completionTokens: entry.completionTokens,
    totalTokens: entry.totalTokens,
  });

  const record: AiAuditEntry = {
    ...entry,
    id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    estimatedCostUsd,
  };

  auditLogs.unshift(record);
  if (auditLogs.length > MAX_AUDIT_LOGS) {
    auditLogs.length = MAX_AUDIT_LOGS;
  }

  // Update per-user usage (bounded FIFO eviction to prevent unbounded memory growth)
  if (!usageByUser.has(record.userId) && usageByUser.size >= MAX_TRACKED_USERS) {
    const oldestKey = usageByUser.keys().next().value;
    if (oldestKey !== undefined) {
      usageByUser.delete(oldestKey);
    }
  }
  const userBucket = usageByUser.get(record.userId) ?? createEmptyBucket();
  userBucket.requests += 1;
  if (record.status === "SUCCESS") userBucket.successes += 1;
  else userBucket.failures += 1;
  userBucket.promptTokens += record.promptTokens;
  userBucket.completionTokens += record.completionTokens;
  userBucket.totalTokens += record.totalTokens;
  userBucket.estimatedCostUsd = Number(
    (userBucket.estimatedCostUsd + estimatedCostUsd).toFixed(6),
  );
  usageByUser.set(record.userId, userBucket);

  // Update per-feature usage
  const featBucket = usageByFeature.get(record.feature) ?? createEmptyBucket();
  featBucket.requests += 1;
  if (record.status === "SUCCESS") featBucket.successes += 1;
  else featBucket.failures += 1;
  featBucket.promptTokens += record.promptTokens;
  featBucket.completionTokens += record.completionTokens;
  featBucket.totalTokens += record.totalTokens;
  featBucket.estimatedCostUsd = Number(
    (featBucket.estimatedCostUsd + estimatedCostUsd).toFixed(6),
  );
  usageByFeature.set(record.feature, featBucket);

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[AI_AUDIT] feature=${record.feature} provider=${record.provider} model=${record.model} status=${record.status} latency=${record.latencyMs}ms tokens=${record.totalTokens} cost=$${record.estimatedCostUsd} fallback=${record.fallbackUsed}${record.errorCode ? ` code=${record.errorCode}` : ""}`,
    );
  }

  // Durable non-blocking DB write (never blocks user request or breaks unit tests)
  if (process.env.NODE_ENV !== "test" && prisma?.aiRequestAudit?.create) {
    const dbStatus =
      record.status === "FAILURE"
        ? "FAILED"
        : record.fallbackUsed
          ? "FALLBACK"
          : "SUCCESS";

    void prisma.aiRequestAudit
      .create({
        data: {
          userId: record.userId === "system" ? null : record.userId,
          feature: record.feature,
          provider: record.provider,
          model: record.model,
          status: dbStatus,
          latencyMs: record.latencyMs,
          inputTokens: record.promptTokens,
          outputTokens: record.completionTokens,
          costUsd: record.estimatedCostUsd,
          errorCode: record.errorCode ?? null,
        },
      })
      .catch(() => {
        // Non-fatal: in-memory ring buffer still captures health telemetry
      });
  }

  return record;
};

/**
 * Converts raw SDK / HTTP provider errors into safe, user-facing AppErrors.
 * Never leaks raw provider payloads, API keys, or stack traces to the client.
 */
export const sanitizeProviderError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  const errObj =
    typeof error === "object" && error !== null
      ? (error as {
          status?: number;
          code?: string;
          message?: string;
          name?: string;
        })
      : {};

  const status = errObj.status;
  const code = String(errObj.code ?? "").toUpperCase();
  const msg = String(errObj.message ?? "").toLowerCase();
  const name = String(errObj.name ?? "").toLowerCase();

  // 1. Rate-limit specific user-facing error (HTTP 429)
  if (
    status === 429 ||
    code === "RATE_LIMIT_EXCEEDED" ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("too many requests")
  ) {
    return new AppError(
      429,
      "AI service rate limit reached. Please wait 15–30 seconds and try again.",
      "AI_RATE_LIMITED",
    );
  }

  // 2. Request timeout error (HTTP 504)
  if (
    status === 408 ||
    status === 504 ||
    name.includes("timeout") ||
    code === "ETIMEDOUT" ||
    code === "ECONNABORTED" ||
    msg.includes("timed out") ||
    msg.includes("timeout")
  ) {
    return new AppError(
      504,
      "AI analysis timed out. Please retry your request.",
      "AI_TIMEOUT",
    );
  }

  // 3. Invalid structured output
  if (msg.includes("json") || msg.includes("unreadable output")) {
    return new AppError(
      502,
      "AI returned an invalid structured response. Please try again.",
      "AI_INVALID_OUTPUT",
    );
  }

  // 4. Generic safe fallback (never expose raw provider error text)
  return new AppError(
    503,
    "AI analysis service is temporarily unavailable. Please try again shortly.",
    "AI_UNAVAILABLE",
  );
};

export const getAiReliabilitySnapshot = (userId?: string) => {
  const byFeature: Record<string, AiUsageBucket> = {};
  for (const [k, v] of usageByFeature.entries()) {
    byFeature[k] = v;
  }

  return {
    totalLoggedRequests: auditLogs.length,
    byFeature,
    ...(userId
      ? { currentUserUsage: usageByUser.get(userId) ?? createEmptyBucket() }
      : {}),
    recentLogs: auditLogs.slice(0, 20),
  };
};
