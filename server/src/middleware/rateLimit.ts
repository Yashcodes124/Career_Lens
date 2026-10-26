import rateLimit from "express-rate-limit";
import { env } from "../config/env";

const isTest = env.NODE_ENV === "test";

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again shortly.",
    code: "RATE_LIMITED",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts. Please wait 15 minutes.",
    code: "AUTH_RATE_LIMITED",
  },
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 1000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "AI processing rate limit reached. Please wait a moment and try again.",
    code: "AI_RATE_LIMITED",
  },
});
