import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../app";
import { signToken } from "../utils/jwt";
import { prisma } from "../config/db";

const candidateToken = signToken({
  userId: "user-candidate-1",
  email: "candidate@truehire.test",
  role: "USER",
});

const adminToken = signToken({
  userId: "user-admin-1",
  email: "admin@truehire.test",
  role: "ADMIN",
});

describe("Item 16: Admin Operations Control Plane & Observability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects unauthenticated (401) and non-admin (403) requests to /api/admin/*", async () => {
    const unauth = await request(app).get("/api/admin/overview");
    expect(unauth.status).toBe(401);

    const forbidden = await request(app)
      .get("/api/admin/overview")
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(forbidden.status).toBe(403);

    const forbiddenSync = await request(app)
      .post("/api/admin/job-syncs/run")
      .set("Authorization", `Bearer ${candidateToken}`);
    expect(forbiddenSync.status).toBe(403);
  });

  it("returns aggregate AI reliability metrics with P50/P95 latency and zero user PII", async () => {
    vi.spyOn(prisma.aiRequestAudit, "count").mockResolvedValue(4);
    vi.spyOn(prisma.aiRequestAudit, "findMany")
      .mockResolvedValueOnce([
        {
          feature: "RESUME_ANALYSIS",
          provider: "groq",
          model: "qwen/qwen3.8-27b",
          status: "SUCCESS",
          latencyMs: 120,
          inputTokens: 400,
          outputTokens: 200,
          costUsd: 0.00016,
          errorCode: null,
        },
        {
          feature: "RESUME_ANALYSIS",
          provider: "nvidia",
          model: "nvidia/nemotron-3.5-super-vl-120b-a12b",
          status: "FALLBACK",
          latencyMs: 300,
          inputTokens: 400,
          outputTokens: 220,
          costUsd: 0.00029,
          errorCode: null,
        },
        {
          feature: "INTERVIEW_ANSWER_EVAL",
          provider: "groq",
          model: "openai/gpt-oss-20b",
          status: "FAILED",
          latencyMs: 1500,
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
          errorCode: "AI_TIMEOUT",
        },
        {
          feature: "INTERVIEW_FINAL_EVAL",
          provider: "groq",
          model: "openai/gpt-oss-120b",
          status: "SUCCESS",
          latencyMs: 500,
          inputTokens: 800,
          outputTokens: 350,
          costUsd: 0.0006,
          errorCode: null,
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "audit-fail-1",
          feature: "INTERVIEW_ANSWER_EVAL",
          provider: "groq",
          model: "openai/gpt-oss-20b",
          status: "FAILED",
          latencyMs: 1500,
          errorCode: "AI_TIMEOUT",
          createdAt: new Date(),
        },
      ] as never);

    const res = await request(app)
      .get("/api/admin/ai-reliability?from=2026-01-01T00:00:00.000Z")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalRequests).toBe(4);
    expect(res.body.data.summary.fallbackCount).toBe(1);
    expect(res.body.data.summary.timeoutCount).toBe(1);
    expect(res.body.data.summary.p50LatencyMs).toBe(300);
    expect(res.body.data.summary.p95LatencyMs).toBe(1500);

    // Privacy check: response must never expose userId, email, rawText, or transcript
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain("candidate@truehire.test");
    expect(serialized).not.toContain("userId");
    expect(serialized).not.toContain("rawText");
    expect(serialized).not.toContain("transcript");
  });

  it("returns aggregate closed-loop effectiveness metrics without exposing user transcripts", async () => {
    vi.spyOn(prisma.interview, "findMany").mockResolvedValue([
      { userId: "u-1", status: "COMPLETED" },
      { userId: "u-1", status: "COMPLETED" },
      { userId: "u-2", status: "IN_PROGRESS" },
    ] as never);
    vi.spyOn(prisma.evaluation, "count").mockResolvedValue(2);
    vi.spyOn(prisma.userSkill, "findMany").mockResolvedValue([
      { status: "STRONG" },
      { status: "STRONG" },
      { status: "WEAK" },
    ] as never);
    vi.spyOn(prisma.featureUsageEvent, "count").mockResolvedValue(3);
    vi.spyOn(prisma.application, "findMany").mockResolvedValue([
      { matchScore: 80 },
      { matchScore: 90 },
    ] as never);

    const res = await request(app)
      .get("/api/admin/closed-loop")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.completedInterviews).toBe(2);
    expect(res.body.data.summary.repeatInterviewRatePct).toBe(100);
    expect(res.body.data.summary.returningUsersWithCompletedInterviews).toBe(1);
    expect(JSON.stringify(res.body)).not.toContain("u-1");
  });
});
