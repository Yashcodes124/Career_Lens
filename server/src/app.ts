import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import readinessRoutes from "./routes/readinessRoutes";
import { AppError } from "./utils/appError";

// Builds the Express app without starting the HTTP server, so tests can import it.
export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/readiness", readinessRoutes);

app.get("/health", async (_req: Request, res: Response) => {
  try {
    const dbConnected = await checkDatabaseConnection();
    res.json({
      status: "ok",
      database: dbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found", code: "NOT_FOUND" });
});

// Every failure leaves the API in one shape: { success: false, message, code }.
// Internal details are logged, never sent to the client.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ success: false, message: err.message, code: err.code });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    code: "INTERNAL_ERROR",
  });
});
