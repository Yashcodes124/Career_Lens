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

const app = express();

// Security & proxy trust for Render/Railway free tiers
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
        callback(null, true); // Permissive in dev/preview deployments
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use("/api", globalRateLimiter);

// Health & readiness endpoint
app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      database: "connected",
      aiConfigured: Boolean(env.resolvedAiApiKey),
    });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error instanceof Error ? error.message : "Database check failed",
    });
  }
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/readiness", readinessRoutes);

// 404 Handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized Error Handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.flatten().fieldErrors,
    });
  }

  // Handle Multer file size / upload errors cleanly
  if (typeof err === "object" && err !== null && "code" in err) {
    const multerErr = err as { code?: string; message?: string };
    if (multerErr.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Uploaded file exceeds the 5MB size limit.",
        code: "FILE_TOO_LARGE",
      });
    }
  }

  console.error("[Unhandled Server Error]:", err);
  return res.status(500).json({
    error:
      env.NODE_ENV === "production"
        ? "An unexpected server error occurred"
        : err instanceof Error
          ? err.message
          : "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
});

export default app;
