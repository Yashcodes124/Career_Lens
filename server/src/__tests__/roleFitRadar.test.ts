import { describe, expect, it } from "vitest";
import { buildRoleFitRadar } from "../services/matching/roleFitRadarService";

describe("P1.12 Role-Fit Radar Strategic Classification", () => {
  const sampleJobs = [
    {
      id: "job-best",
      title: "Senior Full-Stack Engineer",
      company: "Stripe",
      location: "Remote",
      source: "GREENHOUSE",
      url: "https://example.com/1",
      salaryRange: null,
      lastSyncedAt: new Date().toISOString(),
      requirements: ["react", "typescript", "node.js", "postgresql"],
      description: "React TypeScript Node.js PostgreSQL",
    },
    {
      id: "job-one-skill",
      title: "Backend Distributed Systems Engineer",
      company: "Razorpay",
      location: "Bengaluru",
      source: "LEVER",
      url: "https://example.com/2",
      salaryRange: null,
      lastSyncedAt: new Date().toISOString(),
      requirements: ["node.js", "postgresql", "kafka"],
      description: "Node.js PostgreSQL Kafka",
    },
    {
      id: "job-unvalidated",
      title: "Frontend Platform Engineer",
      company: "Linear",
      location: "Remote",
      source: "ASHBY",
      url: "https://example.com/3",
      salaryRange: null,
      lastSyncedAt: new Date().toISOString(),
      requirements: ["react", "typescript", "next.js", "tailwind css"],
      description: "React TypeScript Next.js Tailwind CSS",
    },
    {
      id: "job-poor-fit",
      title: "Staff Rust & CUDA Kernel Engineer",
      company: "Anthropic",
      location: "San Francisco",
      source: "GREENHOUSE",
      url: "https://example.com/4",
      salaryRange: null,
      lastSyncedAt: new Date().toISOString(),
      requirements: ["rust", "cuda", "c++", "pytorch", "kubernetes", "linux"],
      description: "Rust CUDA C++ PyTorch Kubernetes Linux",
    },
  ];

  it("classifies jobs into Top Best-Fit, +1 Skill Breakouts, Evidence-Shifted, Needs Validation, and Deprioritized", () => {
    const radar = buildRoleFitRadar({
      resumeSkills: [
        "react",
        "typescript",
        "node.js",
        "next.js",
        "tailwind css",
      ],
      userSkills: [
        // Proven in interview even though absent from resume -> boosts job-best & job-one-skill
        {
          skill: "postgresql",
          status: "STRONG",
          evidence: "Demonstrated indexing & query optimization in interview",
        },
      ],
      jobs: sampleJobs,
    });

    // 1. Top Best-Fit includes job-best (100% match)
    expect(radar.buckets.topBestFit[0].jobId).toBe("job-best");
    expect(radar.buckets.topBestFit[0].verifiedScore).toBe(100);

    // 2. +1 Skill Breakout includes job-one-skill (67% -> 100% by adding kafka)
    const breakout = radar.buckets.oneSkillBreakouts.find(
      (j) => j.jobId === "job-one-skill",
    );
    expect(breakout).toBeDefined();
    expect(breakout?.topUnlockSkill).toBe("kafka");
    expect(breakout?.projectedScoreWithOneSkill).toBe(100);

    // 3. Evidence-Shifted captures jobs whose score increased from STRONG postgresql
    expect(
      radar.buckets.evidenceShifted.some(
        (j) => j.jobId === "job-best" && j.evidenceDeltaPct > 0,
      ),
    ).toBe(true);

    // 4. Needs Validation captures job-unvalidated (100% paper match, 0 interview-verified skills)
    expect(
      radar.buckets.needsValidation.some((j) => j.jobId === "job-unvalidated"),
    ).toBe(true);

    // 5. Deprioritized captures job-poor-fit (0% match)
    expect(
      radar.buckets.deprioritized.some((j) => j.jobId === "job-poor-fit"),
    ).toBe(true);
  });
});
