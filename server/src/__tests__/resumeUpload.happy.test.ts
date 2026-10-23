import path from "path";
import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// Real PDF/DOCX parsing runs. Only the AI call and the database are replaced.
vi.mock("../config/db", () => ({
  prisma: {},
  checkDatabaseConnection: vi.fn(async () => true),
}));
vi.mock("../integrations/ai/aiClient", () => ({ analyzeResume: vi.fn() }));
vi.mock("../repositories/resumeRepository", () => ({
  createResume: vi.fn(),
  getResumeByUserId: vi.fn(),
  getResumeById: vi.fn(),
  deleteResumeForUser: vi.fn(),
}));

import { app } from "../app";
import { signToken } from "../utils/jwt";
import { analyzeResume } from "../integrations/ai/aiClient";
import * as repo from "../repositories/resumeRepository";

const token = signToken({ userId: "user-1", email: "a@example.com", role: "USER" });
const auth = { Authorization: `Bearer ${token}` };

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, "fixtures", name));

const analysis = {
  summary: "Backend engineer",
  skills: ["TypeScript", "Node.js", "typescript", "PostgreSQL"],
  education: [],
  experience: [],
  projects: [],
  totalExperienceYears: 2,
};

describe("POST /api/resumes with real files", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(repo.createResume).mockImplementation(async (data) => ({
      id: "resume-1",
      ...data,
      createdAt: new Date("2026-10-22T00:00:00Z"),
      updatedAt: new Date("2026-10-22T00:00:00Z"),
    }) as never);
  });

  it("parses a real PDF, sends its text to the AI, and returns 201", async () => {
    vi.mocked(analyzeResume).mockResolvedValue(analysis);

    const res = await request(app)
      .post("/api/resumes")
      .set(auth)
      .attach("resume", fixture("sample-resume.pdf"), {
        filename: "sample-resume.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.resume.skills).toEqual(["TypeScript", "Node.js", "PostgreSQL"]);

    const prompt = vi.mocked(analyzeResume).mock.calls[0][0];
    expect(prompt).toContain("Jane Doe");
    expect(prompt).toContain("Acme Corp");

    expect(repo.createResume).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        mimeType: "application/pdf",
        fileName: "sample-resume.pdf",
        experienceYrs: 2,
      }),
    );
  });

  it("parses a real DOCX and returns 201", async () => {
    vi.mocked(analyzeResume).mockResolvedValue(analysis);

    const res = await request(app)
      .post("/api/resumes")
      .set(auth)
      .attach("resume", fixture("sample-resume.docx"), {
        filename: "sample-resume.docx",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

    expect(res.status).toBe(201);
    const prompt = vi.mocked(analyzeResume).mock.calls[0][0];
    expect(prompt).toContain("Acme Corp");
  });

  it("returns 422 RESUME_UNPARSEABLE when the AI never returns valid structure", async () => {
    vi.mocked(analyzeResume).mockResolvedValue({ not: "a resume" });

    const res = await request(app)
      .post("/api/resumes")
      .set(auth)
      .attach("resume", fixture("sample-resume.pdf"), {
        filename: "sample-resume.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ success: false, code: "RESUME_UNPARSEABLE" });
    expect(repo.createResume).not.toHaveBeenCalled();
  });
});
