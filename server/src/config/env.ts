import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .default(
      "postgresql://postgres:postgres@localhost:5432/truehire?schema=public",
    ),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters")
    .default("truehire-dev-secret-key-change-in-prod-2026"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().default("http://localhost:5173"),

  // Supports NVIDIA NIM, Groq, Gemini OpenAI-compatible URL, or OpenAI
  AI_BASE_URL: z.string().default("https://integrate.api.nvidia.com/v1"),
  AI_API_KEY: z.string().optional(),
  NVIDIA_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("meta/llama-3.1-70b-instruct"),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(25000),

  // Comma-separated public Greenhouse board tokens (100% free, no API key needed)
  GREENHOUSE_BOARDS: z
    .string()
    .default("stripe,vercel,cloudflare,datadog,discord"),
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

export const env = {
  ...rawEnv,
  // Resolve whichever AI key is provided
  resolvedAiApiKey:
    rawEnv.AI_API_KEY || rawEnv.NVIDIA_API_KEY || rawEnv.OPENAI_API_KEY || "",
  greenhouseBoardList: rawEnv.GREENHOUSE_BOARDS.split(",")
    .map((b) => b.trim().toLowerCase())
    .filter(Boolean),
};
