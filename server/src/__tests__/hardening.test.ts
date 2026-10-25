import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import express from "express";
import type { AddressInfo } from "net";

const m = vi.hoisted(() => ({
  prisma: { job: { findUnique: vi.fn() } },
  saveJob: vi.fn(),
}));
vi.mock("../config/db", () => ({ prisma: m.prisma }));
vi.mock("../repositories/savedJobRepository", () => ({
  saveJob: m.saveJob,
  unsaveJob: vi.fn(),
  getSavedJobs: vi.fn(),
}));

import { requireRole } from "../middleware/requireRole";
import { authLimiter } from "../middleware/rateLimit";
import { parseJobQuery } from "../utils/jobQuery";
import { saveJobService } from "../services/savedJobService";

const callRole = (role: string | undefined, required: "ADMIN" | "USER") => {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn();
  const next = vi.fn();
  const req = { user: role === undefined ? undefined : { userId: "u1", email: "a@b.c", role } };
  requireRole(required)(req as never, { status, json } as never, next);
  return { status, json, next };
};

describe("requireRole", () => {
  it("rejects a signed-in user without the role with 403", () => {
    const { status, next } = callRole("USER", "ADMIN");
    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("lets an admin through", () => {
    const { next } = callRole("ADMIN", "ADMIN");
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects a request with no user at all", () => {
    const { status, next } = callRole(undefined, "ADMIN");
    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("parseJobQuery", () => {
  it("uses safe defaults", () => {
    expect(parseJobQuery({})).toEqual({
      q: undefined, location: undefined, source: undefined, page: 1, pageSize: 50,
    });
  });

  it("clamps page and page size, trims text, and uppercases the source", () => {
    const parsed = parseJobQuery({ page: "-3", pageSize: "500", q: "  backend  ", source: "greenhouse" });
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(100);
    expect(parsed.q).toBe("backend");
    expect(parsed.source).toBe("GREENHOUSE");
  });

  it("ignores non-text values instead of passing them to the database", () => {
    const parsed = parseJobQuery({ q: ["a", "b"], location: { $gt: "" } });
    expect(parsed.q).toBeUndefined();
    expect(parsed.location).toBeUndefined();
  });
});

describe("authLimiter", () => {
  const app = express();
  app.post("/attempt", authLimiter, (_req, res) => {
    res.json({ ok: true });
  });
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  afterAll(() => {
    server.close();
  });

  it("answers the first ten attempts and then returns 429", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await fetch(`http://127.0.0.1:${port}/attempt`, { method: "POST" });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);

    const body = await (await fetch(`http://127.0.0.1:${port}/attempt`, { method: "POST" })).json();
    expect(body).toMatchObject({ success: false, code: "RATE_LIMITED" });
  });
});

describe("saveJobService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for a job that does not exist, instead of saving a broken row", async () => {
    m.prisma.job.findUnique.mockResolvedValue(null);
    await expect(saveJobService("u1", "missing")).rejects.toMatchObject({
      status: 404,
      code: "JOB_NOT_FOUND",
    });
    expect(m.saveJob).not.toHaveBeenCalled();
  });

  it("returns 404 for a job that is no longer active", async () => {
    m.prisma.job.findUnique.mockResolvedValue({ id: "j1", isActive: false });
    await expect(saveJobService("u1", "j1")).rejects.toMatchObject({ status: 404 });
    expect(m.saveJob).not.toHaveBeenCalled();
  });

  it("saves an active job", async () => {
    m.prisma.job.findUnique.mockResolvedValue({ id: "j1", isActive: true });
    m.saveJob.mockResolvedValue({ id: "s1" });
    await saveJobService("u1", "j1");
    expect(m.saveJob).toHaveBeenCalledWith("u1", "j1");
  });
});
