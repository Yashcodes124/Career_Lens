import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { ZodError } from "zod";
import { env } from "./config/env";
import { prisma } from "./config/db";
import { AppError } from "./utils/appError";
import { globalRateLimiter } from "./middleware/rateLimit";

import authRoutes from "./routes/auth";
import resumeRoutes from "./routes/resumeRoutes";
import jobRoutes from "./routes/jobRoutes";
import matchRoutes from "./routes/matchRoutes";
import interviewRoutes from "./routes/interviewRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import readinessRoutes from "./routes/readinessRoutes";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const allowedOrigins = env.CLIENT_URL.split(",").map((url) => url.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use("/api", globalRateLimiter);

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: "connected",
      aiConfigured: Boolean(env.resolvedAiApiKey),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "degraded",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error instanceof Error ? error.message : "Database check failed",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/readiness", readinessRoutes);

// 404 Handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(
    new AppError(
      404,
      `Route ${req.method} ${req.originalUrl} not found`,
      "NOT_FOUND",
    ),
  );
});

// Centralized Error Handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      code: err.code,
      message: err.message,
      error: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    });
  }

  if (typeof err === "object" && err !== null && "code" in err) {
    const multerErr = err as {
      code?: string;
      message?: string;
      status?: number;
    };
    if (multerErr.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        code: "FILE_TOO_LARGE",
        message: "Uploaded file exceeds the 5MB size limit.",
        error: "Uploaded file exceeds the 5MB size limit.",
      });
    }
    if (multerErr.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        code: "INVALID_FILE_FIELD",
        message: "Unexpected file upload field name.",
        error: "Unexpected file upload field name.",
      });
    }
    if (typeof multerErr.status === "number") {
      return res.status(multerErr.status).json({
        success: false,
        code: multerErr.code || "ERROR",
        message: multerErr.message || "Request failed",
        error: multerErr.message || "Request failed",
      });
    }
  }

  console.error("[Unhandled Server Error]:", err);
  const fallbackMessage =
    env.NODE_ENV === "production"
      ? "An unexpected server error occurred"
      : err instanceof Error
        ? err.message
        : "Internal server error";

  return res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: fallbackMessage,
    error: fallbackMessage,
  });
});

export default app;
