import { describe, expect, it, vi, beforeEach } from "vitest";
import { countSkillMentions } from "../services/matching/skillDictionary";
import { normalizeSkill } from "../services/matching/skillNormalizer";
import { extractJobSkills } from "../services/matching/jobSkillExtractor";
import { calculateMatch } from "../services/matching/matchingService";

describe("skill extraction from job text", () => {
  it("does not turn 'JavaScript' into java, 'digital' into git, or 'reactive' into react", () => {
    const skills = extractJobSkills(
      "Build reactive UIs in JavaScript for our digital platform.",
    );
    expect(skills).toEqual(["javascript"]);
  });

  it("finds names that end in symbols and aliases", () => {
    const skills = extractJobSkills(
      "Experience with React.js, Node.js, PostgreSQL, C++ and C#.",
    );
    expect(skills).toEqual(expect.arrayContaining(["react", "node.js", "postgresql", "c++", "c#"]));
    expect(skills).not.toContain("sql");
  });

  it("counts each mention once, even when a name contains a shorter alias", () => {
    const counts = countSkillMentions("Node.js services. We run node.js in prod. Node.js!");
    expect(counts.get("node.js")).toBe(3);
  });
});

describe("skill normalization", () => {
  it("collapses whitespace before alias lookup", () => {
    expect(normalizeSkill("  ReactJS   ")).toBe("react");
    expect(normalizeSkill("React   Native")).toBe("react native");
  });

  it("maps common aliases to one canonical name", () => {
    expect(normalizeSkill("PostgreSQL")).toBe("postgresql");
    expect(normalizeSkill("Postgres")).toBe("postgresql");
    expect(normalizeSkill("Node.js")).toBe("node.js");
    expect(normalizeSkill("Tailwind")).toBe("tailwind css");
  });
});

describe("match scoring and gaps", () => {
  const description =
    "We need Docker for deployments. Docker runs our CI. Maintain Docker images. AWS hosting.";

  it("scores by matched share and explains each gap", () => {
    const result = calculateMatch(["React", "Node.js", "Git"], ["React", "Docker", "AWS"], description);

    expect(result.status).toBe("OK");
    expect(result.score).toBe(33);
    expect(result.matchedSkills).toEqual(["react"]);
    expect(result.missingSkills).toEqual(["docker", "aws"]);
  });

  it("ranks gaps by how often the posting names them", () => {
    const result = calculateMatch(["React"], ["React", "Docker", "AWS"], description);

    expect(result.skillGaps).toEqual([
      { skill: "docker", priority: "high", evidence: "Named 3 times in the job description" },
      { skill: "aws", priority: "low", evidence: "Named 1 time in the job description" },
    ]);
  });

  it("returns INSUFFICIENT_DATA instead of a score of 0 when the job lists no known skills", () => {
    const result = calculateMatch(["React"], [], "Great team, great culture.");

    expect(result.status).toBe("INSUFFICIENT_DATA");
    expect(result.score).toBeNull();
    expect(result.skillGaps).toEqual([]);
  });

  it("uses medium priority when no description is available to count mentions", () => {
    const result = calculateMatch([], ["Docker"]);

    expect(result.skillGaps[0]).toEqual({
      skill: "docker",
      priority: "medium",
      evidence: "Listed in the job requirements",
    });
  });
});

const mocks = vi.hoisted(() => ({
  getResumeById: vi.fn(),
  getJobById: vi.fn(),
  upsertApplicationMatch: vi.fn(),
}));

vi.mock("../repositories/resumeRepository", () => ({ getResumeById: mocks.getResumeById }));
vi.mock("../repositories/jobRepository", () => ({ getJobById: mocks.getJobById }));
vi.mock("../repositories/matchRepository", () => ({
  upsertApplicationMatch: mocks.upsertApplicationMatch,
}));

import { matchResumeToJob } from "../services/matching/matchService";

describe("matchResumeToJob persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the score and gap names onto the user's application for the job", async () => {
    mocks.getResumeById.mockResolvedValue({ id: "r1", skills: ["React"] });
    mocks.getJobById.mockResolvedValue({
      id: "j1",
      isActive: true,
      requirements: ["react", "docker"],
      description: "Docker Docker Docker",
    });
    mocks.upsertApplicationMatch.mockResolvedValue({ id: "a1" });

    const result = await matchResumeToJob("u1", "r1", "j1");

    expect(mocks.upsertApplicationMatch).toHaveBeenCalledWith("u1", "j1", {
      matchScore: 50,
      skillGaps: ["docker"],
    });
    expect(result.applicationId).toBe("a1");
    expect(result.score).toBe(50);
  });

  it("stores a null score for insufficient data rather than inventing one", async () => {
    mocks.getResumeById.mockResolvedValue({ id: "r1", skills: ["React"] });
    mocks.getJobById.mockResolvedValue({ id: "j1", isActive: true, requirements: [], description: "" });
    mocks.upsertApplicationMatch.mockResolvedValue({ id: "a1" });

    await matchResumeToJob("u1", "r1", "j1");

    expect(mocks.upsertApplicationMatch).toHaveBeenCalledWith("u1", "j1", {
      matchScore: null,
      skillGaps: [],
    });
  });

  it("rejects inactive jobs with a 404", async () => {
    mocks.getResumeById.mockResolvedValue({ id: "r1", skills: [] });
    mocks.getJobById.mockResolvedValue({ id: "j1", isActive: false, requirements: [], description: "" });

    await expect(matchResumeToJob("u1", "r1", "j1")).rejects.toMatchObject({
      status: 404,
      code: "JOB_NOT_FOUND",
    });
    expect(mocks.upsertApplicationMatch).not.toHaveBeenCalled();
  });
});
