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
  CLIENT_URL: z.string().default("http://localhost:5173"),
  SERVER_URL: z.string().default("http://localhost:5000"),

  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters")
    .default("truehire-secure-jwt-secret-key-2026"),
  JWT_EXPIRES_IN: z.string().default("7d"),

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

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment configuration:",
    parsed.error.flatten().fieldErrors,
  );
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const rawEnv = parsed.success ? parsed.data : envSchema.parse({});

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
  resolvedAiApiKey: resolvedApiKey,
  greenhouseBoardList: rawEnv.GREENHOUSE_BOARDS.split(",")
    .map((b) => b.trim().toLowerCase())
    .filter(Boolean),
};
