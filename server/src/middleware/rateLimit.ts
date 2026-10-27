import rateLimit from "express-rate-limit";

const rateLimitPayload = (message: string) => ({
  success: false,
  code: "RATE_LIMITED",
  message,
  error: message,
});

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitPayload("Too many requests, please try again shortly."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitPayload(
    "Too many authentication attempts. Please wait 15 minutes.",
  ),
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitPayload("Too many file uploads, please try again later."),
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitPayload(
    "AI processing rate limit reached. Please wait a moment and try again.",
  ),
});

export const authRateLimiter = authLimiter;
export const uploadRateLimiter = uploadLimiter;
export const aiRateLimiter = aiLimiter;
