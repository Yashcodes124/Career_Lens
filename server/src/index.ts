import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import resumeRoutes from "../src/routes/resume.js";

const app = express();

// Middleware
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  try {
    const dbConnected = await checkDatabaseConnection();
    res.json({
      status: "ok",
      database: dbConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Client URL: ${env.CLIENT_URL}`);
});
