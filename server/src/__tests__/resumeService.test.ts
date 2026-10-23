import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../utils/appError";

vi.mock("../integrations/ai/aiClient", () => ({ analyzeResume: vi.fn() }));
vi.mock("../repositories/resumeRepository", () => ({
  createResume: vi.fn(),
  getResumeByUserId: vi.fn(),
  getResumeById: vi.fn(),
  deleteResumeForUser: vi.fn(),
}));
vi.mock("../utils/documentParser", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/documentParser")>();
  return { ...actual, extractTextFromDocument: vi.fn() };
});

import { analyzeResume } from "../integrations/ai/aiClient";
import * as repo from "../repositories/resumeRepository";
import { extractTextFromDocument } from "../utils/documentParser";
import {
  analyzeResumeText,
  cleanSkillList,
  createResumeService,
  deleteResumeService,
} from "../services/resume/resumeService";

const validAnalysis = {
  summary: "Backend engineer with Node.js experience",
  skills: ["React", " react ", "Node.js", "", "TypeScript"],
  education: [],
  experience: [],
  projects: [],
  totalExperienceYears: 2.6,
};

const longText = "Experienced engineer. ".repeat(10);

const fakeFile = {
  originalname: "cv.pdf",
  mimetype: "application/pdf",
  size: 1234,
  buffer: Buffer.from("%PDF-1.4"),
} as Express.Multer.File;

describe("cleanSkillList", () => {
  it("trims, collapses whitespace, and removes case-insensitive duplicates", () => {
    expect(cleanSkillList(["React", " react ", "Node   .js", ""])).toEqual([
      "React",
      "Node .js",
    ]);
  });

  it("caps the list at 100 skills", () => {
    const many = Array.from({ length: 150 }, (_, i) => `skill-${i}`);
    expect(cleanSkillList(many)).toHaveLength(100);
  });
});

describe("analyzeResumeText (retry and validation)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retries once when the first output fails schema validation", async () => {
    vi.mocked(analyzeResume)
      .mockResolvedValueOnce({ skills: "not-an-array" })
      .mockResolvedValueOnce(validAnalysis);

    const result = await analyzeResumeText(longText);

    expect(result.skills).toContain("React");
    expect(analyzeResume).toHaveBeenCalledTimes(2);
  });

  it("gives up with RESUME_UNPARSEABLE after two invalid outputs", async () => {
    vi.mocked(analyzeResume).mockResolvedValue({ wrong: true });

    await expect(analyzeResumeText(longText)).rejects.toMatchObject({
      status: 422,
      code: "RESUME_UNPARSEABLE",
    });
    expect(analyzeResume).toHaveBeenCalledTimes(2);
  });

  it("does not retry when the AI provider is unavailable", async () => {
    vi.mocked(analyzeResume).mockRejectedValue(
      new AppError(503, "temporarily unavailable", "AI_UNAVAILABLE"),
    );

    await expect(analyzeResumeText(longText)).rejects.toMatchObject({
      code: "AI_UNAVAILABLE",
    });
    expect(analyzeResume).toHaveBeenCalledTimes(1);
  });
});

describe("createResumeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a file with no readable text before calling the AI", async () => {
    vi.mocked(extractTextFromDocument).mockResolvedValue("   ");

    await expect(createResumeService("user-1", fakeFile)).rejects.toMatchObject({
      status: 422,
      code: "NO_READABLE_TEXT",
    });
    expect(analyzeResume).not.toHaveBeenCalled();
    expect(repo.createResume).not.toHaveBeenCalled();
  });

  it("stores cleaned skills, rounded experience, and the PDF mime type", async () => {
    vi.mocked(extractTextFromDocument).mockResolvedValue(longText);
    vi.mocked(analyzeResume).mockResolvedValue(validAnalysis);
    vi.mocked(repo.createResume).mockResolvedValue({ id: "r1" } as never);

    await createResumeService("user-1", fakeFile);

    expect(repo.createResume).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        fileName: "cv.pdf",
        mimeType: "application/pdf",
        skills: ["React", "Node.js", "TypeScript"],
        experienceYrs: 3,
      }),
    );
  });
});

describe("deleteResumeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the resume does not belong to the user", async () => {
    vi.mocked(repo.deleteResumeForUser).mockResolvedValue({ count: 0 });

    await expect(deleteResumeService("user-1", "other-users-resume")).rejects.toMatchObject({
      status: 404,
      code: "RESUME_NOT_FOUND",
    });
  });
});
