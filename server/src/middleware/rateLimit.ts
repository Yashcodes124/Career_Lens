import rateLimit from "express-rate-limit";
import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "./authMiddleware";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const rejected = (message: string) => ({ success: false, message, code: "RATE_LIMITED" });

// Sign-in and sign-up have no account yet, so they are limited per IP address.
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req: Request, res: Response) =>
    res.status(429).json(rejected("Too many attempts. Try again in 15 minutes.")),
});

// Signed-in routes are limited per account, so one user cannot use up another's quota.
const keyByUser = (req: Request): string =>
  (req as AuthenticatedRequest).user?.userId ?? req.ip ?? "unknown";

const createUserLimiter = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    keyGenerator: keyByUser,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req: Request, res: Response, _next: NextFunction) =>
      res.status(429).json(rejected(message)),
  });

export const uploadLimiter = createUserLimiter(
  ONE_HOUR,
  10,
  "You have reached the limit of 10 resume uploads per hour.",
);

// Every interview answer and report calls a paid model.
export const aiLimiter = createUserLimiter(
  ONE_HOUR,
  30,
  "You have reached the limit of AI interview requests for this hour. Try again later.",
);
