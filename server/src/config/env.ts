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

  AI_BASE_URL: z.string().default("https://integrate.api.nvidia.com/v1"),
  AI_API_KEY: z.string().optional(),
  NVIDIA_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  NVIDIA_MODEL: z.string().default("meta/llama-3.1-70b-instruct"),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000), // Extended to 60s for reasoning models

  GREENHOUSE_BOARD_TOKEN: z.string().default("stripe"),
  GREENHOUSE_COMPANY: z.string().default("stripe"),
  GREENHOUSE_BOARDS: z
    .string()
    .default("stripe,razorpay,swiggy,zomato,zerodha,cloudflare,vercel"),
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

const resolvedApiKey =
  rawEnv.NVIDIA_API_KEY || rawEnv.AI_API_KEY || rawEnv.OPENAI_API_KEY || "";
const resolvedModel =
  rawEnv.AI_MODEL || rawEnv.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";

if (resolvedApiKey) {
  process.env.NVIDIA_API_KEY = resolvedApiKey;
  process.env.AI_API_KEY = resolvedApiKey;
}
process.env.NVIDIA_MODEL = resolvedModel;
process.env.AI_MODEL = resolvedModel;
process.env.AI_BASE_URL = rawEnv.AI_BASE_URL;

export const env = {
  ...rawEnv,
  NVIDIA_API_KEY: resolvedApiKey,
  AI_API_KEY: resolvedApiKey,
  NVIDIA_MODEL: resolvedModel,
  AI_MODEL: resolvedModel,
  resolvedAiApiKey: resolvedApiKey,
  greenhouseBoardList: rawEnv.GREENHOUSE_BOARDS.split(",")
    .map((b) => b.trim().toLowerCase())
    .filter(Boolean),
};
