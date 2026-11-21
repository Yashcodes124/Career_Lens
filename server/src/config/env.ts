import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

export const aiProviderEnum = z.enum(["groq", "nvidia", "gemini", "ollama"]);
export type AiProvider = z.infer<typeof aiProviderEnum>;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .default(
      "postgresql://career_lens_user:@localhost:5433/career_lens?schema=public",
    ),
  DIRECT_URL: z.string().optional(),
  CLIENT_URL: z.string().default("http://localhost:3000,http://localhost:5173"),
  SERVER_URL: z.string().default("http://localhost:5000"),

  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters")
    .default("truehire-secure-jwt-secret-key-2026"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET must be at least 16 characters")
    .optional(),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Optional monitoring & sync scheduler controls
  SENTRY_DSN: z.string().optional(),
  ENABLE_STARTUP_JOB_SYNC: z.string().default("true"),
  JOB_SYNC_INTERVAL_HOURS: z.coerce.number().positive().default(6),

  // Multi-provider AI routing
  AI_PROVIDER: aiProviderEnum.default("groq"),
  AI_BASE_URL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),

  // Groq configuration
  GROQ_API_KEY: z.string().optional(),
  GROQ_BASE_URL: z.string().default("https://api.groq.com/openai/v1"),
  GROQ_MODEL: z.string().default("qwen/qwen3.8-27b"),
  GROQ_FAST_MODEL: z.string().default("openai/gpt-oss-20b"),
  GROQ_EVALUATION_MODEL: z.string().default("openai/gpt-oss-120b"),

  // NVIDIA NIM configuration
  NVIDIA_API_KEY: z.string().optional(),
  NVIDIA_BASE_URL: z.string().default("https://integrate.api.nvidia.com/v1"),
  NVIDIA_MODEL: z.string().default("meta/llama-3.3-70b-instruct"),

  // Google Gemini configuration (OpenAI-compatible endpoint)
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_BASE_URL: z
    .string()
    .default("https://generativelanguage.googleapis.com/v1beta/openai/"),
  GEMINI_MODEL: z.string().default("gemini-flash-latest"),

  // Ollama configuration (local development)
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("qwen3:4b"),

  // Legacy / OpenAI alias
  OPENAI_API_KEY: z.string().optional(),

  // ATS Integrations — Pure Software, Cloud, DevTools & Fintech boards (India & Global)
  GREENHOUSE_BOARD_TOKEN: z.string().default("stripe"),
  GREENHOUSE_COMPANY: z.string().default("stripe"),
  GREENHOUSE_BOARDS: z
    .string()
    .default(
      "stripe,razorpay,postman,browserstack,chargebee,druva,clevertap,zerodha,cloudflare,vercel,datadog",
    ),
  GREENHOUSE_API_KEY: z.string().optional(),
  LEVER_API_KEY: z.string().optional(),
  ASHBY_API_KEY: z.string().optional(),
});

const DEFAULT_DEV_JWT_SECRET = "truehire-secure-jwt-secret-key-2026";
export const DEFAULT_DEV_DATABASE_URL =
  "postgresql://career_lens_user:@localhost:5433/career_lens?schema=public";

const POSTGRES_PROTOCOL_RE = /^postgres(?:ql)?:\/\/.+/i;

/**
 * Strips empty or whitespace-only environment strings so Zod `.default(...)`
 * and `.optional()` handlers apply cleanly when a host injects `KEY=""`.
 */
export function sanitizeEnvSource(
  sourceEnv: NodeJS.ProcessEnv,
): Record<string, string | undefined> {
  const cleaned: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(sourceEnv)) {
    if (typeof value === "string" && value.trim() === "") {
      cleaned[key] = undefined;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Ensures a Prisma datasource URL always begins with `postgresql://` or `postgres://`.
 * In non-production environments, invalid or empty values safely fall back to the local dev URL.
 */
export function normalizePostgresUrl(
  value: string | undefined,
  fallback: string = DEFAULT_DEV_DATABASE_URL,
  nodeEnv: string = "development",
): string {
  const trimmed = value?.trim() ?? "";
  if (POSTGRES_PROTOCOL_RE.test(trimmed)) {
    return trimmed;
  }
  if (nodeEnv === "production") {
    return trimmed;
  }
  return fallback;
}

export function validateProductionEnv(
  sourceEnv: NodeJS.ProcessEnv,
  parsedData: z.infer<typeof envSchema>,
): string[] {
  if (parsedData.NODE_ENV !== "production") return [];
  const errors: string[] = [];

  if (
    !sourceEnv.JWT_SECRET ||
    parsedData.JWT_SECRET === DEFAULT_DEV_JWT_SECRET ||
    parsedData.JWT_SECRET.length < 32
  ) {
    errors.push(
      "JWT_SECRET must be explicitly set to a strong secret (>= 32 chars) in production.",
    );
  }

  if (
    !sourceEnv.DATABASE_URL ||
    parsedData.DATABASE_URL === DEFAULT_DEV_DATABASE_URL ||
    !POSTGRES_PROTOCOL_RE.test(parsedData.DATABASE_URL)
  ) {
    errors.push(
      "DATABASE_URL must be explicitly configured with a postgresql:// or postgres:// URL in production.",
    );
  }

  const origins = parsedData.CLIENT_URL.split(",").map((o) => o.trim());
  if (origins.includes("*")) {
    errors.push(
      "CLIENT_URL must not contain wildcard '*' when CORS credentials are enabled in production.",
    );
  }

  return errors;
}

const sanitizedProcessEnv = sanitizeEnvSource(process.env);
const parsed = envSchema.safeParse(sanitizedProcessEnv);

if (!parsed.success) {
  console.error(
    "Invalid environment configuration:",
    parsed.error.flatten().fieldErrors,
  );
  if (sanitizedProcessEnv.NODE_ENV === "production") {
    process.exit(1);
  }
}

const parsedData = parsed.success ? parsed.data : envSchema.parse({});
const normalizedDatabaseUrl = normalizePostgresUrl(
  parsedData.DATABASE_URL,
  DEFAULT_DEV_DATABASE_URL,
  parsedData.NODE_ENV,
);
const normalizedDirectUrl = parsedData.DIRECT_URL
  ? normalizePostgresUrl(
      parsedData.DIRECT_URL,
      normalizedDatabaseUrl,
      parsedData.NODE_ENV,
    )
  : normalizedDatabaseUrl;

const rawEnv = {
  ...parsedData,
  DATABASE_URL: normalizedDatabaseUrl,
  DIRECT_URL: normalizedDirectUrl,
};

// Keep process.env synchronized so Prisma never reads an empty "" datasource URL
process.env.DATABASE_URL = rawEnv.DATABASE_URL;
process.env.DIRECT_URL = rawEnv.DIRECT_URL;

const prodErrors = validateProductionEnv(sanitizedProcessEnv, rawEnv);
if (prodErrors.length > 0) {
  console.error("Production environment security check failed:", prodErrors);
  process.exit(1);
}

const resolveActiveApiKey = (): string => {
  switch (rawEnv.AI_PROVIDER) {
    case "groq":
      return rawEnv.GROQ_API_KEY || rawEnv.AI_API_KEY || "";
    case "nvidia":
      return rawEnv.NVIDIA_API_KEY || rawEnv.AI_API_KEY || "";
    case "gemini":
      return rawEnv.GEMINI_API_KEY || rawEnv.AI_API_KEY || "";
    case "ollama":
      return "ollama";
    default:
      return (
        rawEnv.GROQ_API_KEY ||
        rawEnv.NVIDIA_API_KEY ||
        rawEnv.GEMINI_API_KEY ||
        rawEnv.AI_API_KEY ||
        rawEnv.OPENAI_API_KEY ||
        ""
      );
  }
};

const resolvedApiKey = resolveActiveApiKey();

export const env = {
  ...rawEnv,
  resolvedJwtRefreshSecret: rawEnv.JWT_REFRESH_SECRET || rawEnv.JWT_SECRET,
  resolvedAiApiKey: resolvedApiKey,
  greenhouseBoardList: rawEnv.GREENHOUSE_BOARDS.split(",")
    .map((b) => b.trim().toLowerCase())
    .filter(Boolean),
};
