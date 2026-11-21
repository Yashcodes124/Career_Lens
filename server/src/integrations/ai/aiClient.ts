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
  if (
    process.env.NODE_ENV === "test" &&
    process.env.AI_TEST_FAILOVER !== "true"
  ) {
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

const runDeterministicE2eMock = (
  prompt: string,
  feature: AiFeatureName,
  userId: string,
  schema?: z.ZodTypeAny,
): unknown => {
  const startedAt = Date.now();

  if (prompt.includes("E2E_FORCE_AI_ERROR")) {
    const rawSdkErr = new Error(
      "UPSTREAM_PROVIDER_SECRET_KEY_sk_live_998877_INTERNAL_STACK",
    );
    const sanitized = sanitizeProviderError(rawSdkErr);
    recordAiAudit({
      userId,
      feature,
      provider: "e2e-mock",
      model: "deterministic-e2e-v1",
      latencyMs: 5,
      status: "FAILURE",
      promptTokens: 12,
      completionTokens: 0,
      totalTokens: 12,
      fallbackUsed: false,
      errorCode: sanitized.code,
    });
    throw sanitized;
  }

  let payload: unknown;

  if (feature === "RESUME_ANALYSIS") {
    const knownTokens = [
      "React",
      "TypeScript",
      "JavaScript",
      "Node.js",
      "PostgreSQL",
      "Docker",
      "Kubernetes",
      "AWS",
      "Redis",
      "GraphQL",
      "Python",
      "Go",
    ];
    const detected = knownTokens.filter((sk) =>
      new RegExp(`\\b${sk.replace(".", "\\.")}\\b`, "i").test(prompt),
    );
    const skills =
      detected.length > 0 ? detected : ["React", "TypeScript", "Node.js"];

    payload = {
      summary:
        "Full-stack software engineer with production experience building distributed web applications and APIs.",
      skills,
      totalExperienceYears: 4,
      experience: [
        {
          role: "Senior Software Engineer",
          company: "Acme Cloud Systems",
          duration: "2022 - Present",
          description: `Built and scaled ${skills.slice(0, 3).join(", ")} services handling 10k req/s.`,
        },
      ],
      projects: [
        {
          name: "Distributed Analytics Engine",
          description: `Architected data ingestion pipeline using ${skills.join(", ")}.`,
          technologies: skills,
        },
      ],
      education: [
        {
          degree: "B.S. in Computer Science",
          institution: "State Technical University",
          year: "2021",
        },
      ],
    };
  } else if (feature === "INTERVIEW_GENERATION") {
    if (prompt.includes("Adaptive Directive:")) {
      payload = {
        question:
          "Follow-up: Walk through a concrete production failure mode you mitigated and the exact metrics you tracked.",
      };
    } else {
      payload = {
        questions: [
          {
            order: 1,
            round: "Core Technical & Stack Assessment",
            question:
              "Explain how you structure state management, caching, and error boundaries in a production React and TypeScript application.",
          },
          {
            order: 2,
            round: "System Design & Architecture",
            question:
              "How would you design a rate-limited, idempotent ingestion API backed by PostgreSQL and Redis?",
          },
          {
            order: 3,
            round: "Debugging & Production Trade-offs",
            question:
              "A Kubernetes deployment is experiencing intermittent p99 latency spikes. Walk through your diagnosis steps.",
          },
        ],
      };
    }
  } else if (feature === "INTERVIEW_ANSWER_EVAL") {
    if (prompt.includes("E2E_BUZZWORD")) {
      payload = {
        score: 52,
        feedback:
          "Candidate mentioned technologies superficially and failed to explain core internal mechanics.",
        strengths: ["Identified relevant ecosystem tools"],
        improvements: [
          "Explain underlying fundamentals and trade-offs rather than naming tools.",
        ],
      };
    } else if (prompt.includes("E2E_FAIL")) {
      payload = {
        score: 38,
        feedback:
          "Missed fundamental isolation guarantees and failure recovery requirements.",
        strengths: ["Attempted structured response"],
        improvements: [
          "Review core fundamentals and ACID / distributed consistency guarantees.",
        ],
      };
    } else if (prompt.includes("E2E_VAGUE")) {
      payload = {
        score: 64,
        feedback:
          "Answer is too brief and abstract; needs a concrete production example with metrics.",
        strengths: ["High-level direction is reasonable"],
        improvements: [
          "Provide a concrete production example and quantify latency or throughput.",
        ],
      };
    } else {
      payload = {
        score: 88,
        feedback:
          "Strong, well-structured engineering response with concrete production trade-offs and metrics.",
        strengths: [
          "Clear architectural reasoning and concrete failure mitigation",
        ],
        improvements: ["Optional: mention multi-region failover"],
      };
    }
  } else if (feature === "INTERVIEW_FINAL_EVAL") {
    const failedSession = prompt.includes("E2E_WEAK_SESSION");
    payload = failedSession
      ? {
          score: 48,
          feedback:
            "Candidate struggled to explain Docker container networking and Kubernetes scheduling fundamentals.",
          recommendation: "NO_HIRE",
          breakdown: {
            communication: 60,
            technicalKnowledge: 42,
            problemSolving: 45,
            relevance: 50,
            confidence: 52,
          },
          strengths: ["Clear communication baseline"],
          improvements: [
            "Weak understanding of Docker multi-stage builds and Kubernetes pod networking.",
          ],
        }
      : {
          score: 86,
          feedback:
            "Demonstrated strong command of Docker, PostgreSQL, React, and TypeScript in production scenarios.",
          recommendation: "HIRE",
          breakdown: {
            communication: 88,
            technicalKnowledge: 87,
            problemSolving: 85,
            relevance: 86,
            confidence: 84,
          },
          strengths: [
            "Strong mastery of Docker containerization, PostgreSQL indexing, React, and TypeScript architecture.",
          ],
          improvements: [
            "Continue practicing multi-region active-active failover patterns.",
          ],
        };
  } else {
    payload = { ok: true };
  }

  recordAiAudit({
    userId,
    feature,
    provider: "e2e-mock",
    model: "deterministic-e2e-v1",
    latencyMs: Math.max(1, Date.now() - startedAt),
    status: "SUCCESS",
    promptTokens: 50,
    completionTokens: 40,
    totalTokens: 90,
    fallbackUsed: false,
  });

  if (schema) {
    const validated = schema.safeParse(payload);
    if (validated.success) return validated.data;
  }
  return payload;
};

  if (
    process.env.AI_E2E_MOCK === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    return runDeterministicE2eMock(
      prompt,
      context?.feature ?? "GENERAL",
      context?.userId ?? "system",
      context?.schema,
    );
  }
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
