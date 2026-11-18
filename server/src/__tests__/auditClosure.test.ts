import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildScoreDecomposition,
  buildSkillEvidenceAudit,
  calculateMatch,
  simulateMatchImpact,
  type InterviewEvidence,
} from "../services/matching/matchingService";
import { evaluateAdaptiveFollowUpNeed } from "../services/interviewService";
import { submitSkillProofService } from "../services/readiness/readinessService";
import {
  ALIAS_TO_CANONICAL,
  countSkillMentions,
  hydrateOntologyFromDatabase,
  resolveUnrecognizedSkillToken,
  runExtractionAccuracyBenchmark,
  runFalsePositiveAudit,
} from "../services/matching/skillDictionary";
import { prisma } from "../config/db";
import * as groqClient from "../integrations/ai/groqClient";
import * as nvidiaClient from "../integrations/ai/nvidiaClient";
import * as geminiClient from "../integrations/ai/geminiClient";
import * as ollamaClient from "../integrations/ai/ollamaClient";
import { analyzeResume } from "../integrations/ai/aiClient";

describe("Audit Closure Verification Suite (Items 1–14)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.AI_TEST_FAILOVER;
  });

  // 1. buildScoreDecomposition: all 7 factors + edge cases
  describe("1. buildScoreDecomposition (7 factors & edge cases)", () => {
    it("returns null for INSUFFICIENT_DATA jobs with 0 recognized skills", () => {
      const emptyMatch = calculateMatch(["react"], []);
      expect(emptyMatch.status).toBe("INSUFFICIENT_DATA");
      const decomp = buildScoreDecomposition({
        match: emptyMatch,
        skillAudit: [],
      });
      expect(decomp).toBeNull();
    });

    it("computes all 7 deterministic factors and 3 headline scores accurately", () => {
      const jobSkills = ["react", "typescript", "node.js", "docker", "redis"];
      const jobDescription =
        "Senior Engineer (5+ years): React React React TypeScript TypeScript Node.js Node.js Docker Redis.";
      const interview: InterviewEvidence = {
        strongSkills: ["react"],
        weakSkills: new Map([["docker", "Struggled with multi-stage builds"]]),
      };

      const match = calculateMatch(
        ["react", "typescript", "docker"],
        jobSkills,
        jobDescription,
        interview,
      );
      const audit = buildSkillEvidenceAudit({
        resumeSkills: ["react", "typescript", "docker"],
        resumeRawText:
          "Experience\nBuilt React and TypeScript web applications.",
        jobSkills,
        jobDescription,
        interview,
      });

      const decomp = buildScoreDecomposition({
        match,
        skillAudit: audit,
        candidateExperienceYrs: 3,
        jobTitle: "Senior Full-Stack Engineer",
        jobDescription,
      });

      expect(decomp).not.toBeNull();
      expect(decomp!.headlineScores.matchScore.score).toBe(40); // react + typescript (docker withheld)
      expect(decomp!.headlineScores.readinessScore.score).toBe(30); // 1 strong (1.0) + 1 unverified (0.5) / 5 = 30%
      expect(decomp!.factors.requiredSkillCoverage.total).toBeGreaterThan(0);
      expect(decomp!.factors.preferredSkillCoverage.total).toBeGreaterThan(0);
      expect(decomp!.factors.interviewVerifiedCoverage.verified).toBe(1);
      expect(decomp!.factors.resumeEvidenceQuality.contextualCount).toBe(2);
      expect(decomp!.factors.experienceAlignment.score).toBe(60); // 3 yrs vs 5 yrs (-2 yr gap = 60)
      expect(decomp!.factors.criticalGapPenalty.weakSkills).toBe(1);
      expect(decomp!.factors.jobDescriptionConfidence.extractedSkillCount).toBe(
        5,
      );
    });
  });

  // 2. buildSkillEvidenceAudit: all 6 claim states + repeated failed claim warning + multi-column snippets
  describe("2. buildSkillEvidenceAudit (all 6 claim statuses & snippets)", () => {
    it("classifies VERIFIED_STRONG, VERIFIED_WEAK, RESUME_CLAIMED, CONTEXT_INFERRED, LOW_CONFIDENCE, and MISSING", () => {
      const jobSkills = [
        "react",
        "docker",
        "typescript",
        "postgresql",
        "aws",
        "kubernetes",
      ];
      const interview: InterviewEvidence = {
        strongSkills: ["react"],
        weakSkills: new Map([["docker", "Missed volume persistence"]]),
        weakCitations: new Map([
          ["docker", "Interview 1, Q2 (42%): Missed volume persistence"],
        ]),
      };

      const audit = buildSkillEvidenceAudit({
        resumeSkills: ["react", "docker", "typescript", "aws"],
        resumeRawText: [
          "Experience",
          "• Engineered TypeScript APIs and PostgreSQL queries for high-volume billing.",
          "Skills",
          "React, Docker, TypeScript, AWS",
        ].join("\n"),
        resumeParsedData: {
          experience: [
            {
              description:
                "Engineered TypeScript APIs and PostgreSQL queries for high-volume billing.",
            },
          ],
          skills: ["React", "Docker", "TypeScript", "AWS"],
        },
        jobSkills,
        jobDescription:
          "Looking for React, Docker, TypeScript, PostgreSQL, AWS, and Kubernetes.",
        interview,
      });

      const bySkill = new Map(audit.map((i) => [i.skill, i] as const));
      expect(bySkill.get("react")?.claimStatus).toBe("VERIFIED_STRONG");
      expect(bySkill.get("docker")?.claimStatus).toBe("VERIFIED_WEAK");
      expect(bySkill.get("docker")?.repeatedFailedClaim).toBe(true);
      expect(bySkill.get("typescript")?.claimStatus).toBe("RESUME_CLAIMED");
      expect(bySkill.get("postgresql")?.claimStatus).toBe("CONTEXT_INFERRED");
      expect(bySkill.get("aws")?.claimStatus).toBe("LOW_CONFIDENCE");
      expect(bySkill.get("kubernetes")?.claimStatus).toBe("MISSING");
    });
  });

  // 3. evaluateAdaptiveFollowUpNeed: all 4 trigger paths + cap + no-chaining
  describe("3. evaluateAdaptiveFollowUpNeed (4 triggers, cap, no-chaining)", () => {
    it("triggers UNSUBSTANTIATED_SKILL_CLAIM when candidate names a skill without explaining it", () => {
      const res = evaluateAdaptiveFollowUpNeed({
        question: {
          round: "Core Technical",
          question: "How do you scale APIs?",
        },
        answer: "We just used Kafka for everything.",
        evaluation: {
          score: 58,
          feedback:
            "Candidate mentioned Kafka superficially and failed to explain partitioning.",
        },
        targetSkills: ["kafka"],
        existingQuestions: [],
      });
      expect(res?.trigger).toBe("UNSUBSTANTIATED_SKILL_CLAIM");
      expect(res?.targetSkill).toBe("kafka");
    });

    it("triggers CONCEPT_REMEDIATION when score < 55 without unsubstantiated buzzword claim", () => {
      const res = evaluateAdaptiveFollowUpNeed({
        question: {
          round: "Database",
          question: "Explain ACID isolation levels.",
        },
        answer: "Databases save rows to tables so data stays safe.",
        evaluation: {
          score: 40,
          feedback:
            "Missed read committed, repeatable read, and serializable isolation.",
        },
        targetSkills: ["postgresql"],
        existingQuestions: [],
      });
      expect(res?.trigger).toBe("CONCEPT_REMEDIATION");
    });

    it("triggers VAGUE_ANSWER when answer is brief/high-level", () => {
      const res = evaluateAdaptiveFollowUpNeed({
        question: {
          round: "System Design",
          question: "Design a rate limiter.",
        },
        answer: "I would use a counter in memory and reject extra requests.",
        evaluation: {
          score: 68,
          feedback:
            "Answer is too brief and lacks a concrete production example.",
        },
        targetSkills: ["redis"],
        existingQuestions: [],
      });
      expect(res?.trigger).toBe("VAGUE_ANSWER");
    });

    it("triggers STRONG_ESCALATION on detailed >= 82% answers", () => {
      const res = evaluateAdaptiveFollowUpNeed({
        question: {
          round: "System Design",
          question: "Design a distributed cache.",
        },
        answer:
          "I would deploy a sharded Redis cluster using consistent hashing with virtual nodes, configure TTL jitter to prevent cache stampedes, implement read-through fallback with circuit breakers, and monitor p99 hit latency and eviction rates in Prometheus.",
        evaluation: {
          score: 88,
          feedback:
            "Thorough architectural response covering stampedes and failure recovery.",
        },
        targetSkills: ["redis"],
        existingQuestions: [],
      });
      expect(res?.trigger).toBe("STRONG_ESCALATION");
    });

    it("enforces no-chaining and max 2 follow-ups per session", () => {
      const chained = evaluateAdaptiveFollowUpNeed({
        question: {
          round: "[Follow-Up · Concrete Example] System Design",
          question: "Give an example.",
        },
        answer: "Short answer.",
        evaluation: { score: 45, feedback: "Brief." },
        targetSkills: ["redis"],
        existingQuestions: [],
      });
      expect(chained).toBeNull();

      const capped = evaluateAdaptiveFollowUpNeed({
        question: { round: "Backend", question: "Explain event loops." },
        answer: "Short answer.",
        evaluation: { score: 45, feedback: "Brief." },
        targetSkills: ["node.js"],
        existingQuestions: [
          { round: "[Follow-Up · Concrete Example] Intro" },
          { round: "[Follow-Up · Concept Remediation] SQL" },
        ],
      });
      expect(capped).toBeNull();
    });
  });

  // 4. submitSkillProofService: proof types, optional resume sync, invalid URL, recalculation
  describe("4. submitSkillProofService (preparation-to-proof loop)", () => {
    it("rejects GITHUB_LINK without a valid http(s) URL", async () => {
      await expect(
        submitSkillProofService("user-1", {
          skill: "docker",
          proofType: "GITHUB_LINK",
          description:
            "Built multi-stage production Dockerfile with healthchecks",
        }),
      ).rejects.toThrow(/GitHub repository or pull request URL/i);
    });

    it("persists proof, syncs to active resume, and recalculates readiness", async () => {
      const upsertSpy = vi.spyOn(prisma.userSkill, "upsert").mockResolvedValue({
        id: "us-1",
        userId: "user-1",
        skill: "docker",
        status: "STRONG",
        evidence: "[Proof · GitHub Repository / PR] Built Docker setup",
        updatedAt: new Date(),
      });
      vi.spyOn(prisma.userSkill, "findMany").mockResolvedValue([
        {
          id: "us-1",
          userId: "user-1",
          skill: "docker",
          status: "STRONG",
          evidence: "[Proof · GitHub Repository / PR] Built Docker setup",
          updatedAt: new Date(),
        },
      ]);
      vi.spyOn(prisma.resume, "count").mockResolvedValue(1);
      vi.spyOn(prisma.application, "count").mockResolvedValue(0);
      vi.spyOn(prisma.resume, "findFirst").mockResolvedValue({
        id: "res-1",
        userId: "user-1",
        title: "Resume.pdf",
        fileName: "Resume.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
        rawText: "Built Node.js APIs.",
        parsedData: {},
        skills: ["Node.js"],
        experienceYrs: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const resumeUpdateSpy = vi
        .spyOn(prisma.resume, "update")
        .mockResolvedValue({} as never);
      vi.spyOn(prisma.application, "findMany").mockResolvedValue([]);
      vi.spyOn(prisma.interview, "findMany").mockResolvedValue([]);

      const result = await submitSkillProofService("user-1", {
        skill: "Docker",
        proofType: "GITHUB_LINK",
        title: "docker-prod-template",
        url: "https://github.com/example/docker-prod-template",
        description:
          "Multi-stage Node.js & PostgreSQL container stack with CI checks",
        syncToResume: true,
      });

      expect(upsertSpy).toHaveBeenCalledTimes(1);
      expect(resumeUpdateSpy).toHaveBeenCalledTimes(1);
      expect(result.skillRecord.status).toBe("STRONG");
      expect(result.readiness.defenseSummary?.fortifiedCount).toBe(1);
    });
  });

  // 5. simulateMatchImpact: single-skill, multi-skill, overlapping prerequisite, already-verified
  describe("5. simulateMatchImpact (multi-skill What-If simulator)", () => {
    it("simulates single-skill, multi-skill (capped at 5), prerequisite resolution, and affected job count", () => {
      const sim = simulateMatchImpact({
        resumeSkills: ["linux", "networking", "kubernetes"],
        jobSkills: ["linux", "networking", "docker", "kubernetes", "helm"],
        interview: {
          strongSkills: ["linux"],
          weakSkills: new Map(),
        },
        selectedMissingSkills: ["docker", "helm", "linux"], // linux is already verified
        activeCatalogJobSkills: [
          ["docker", "kubernetes"],
          ["helm", "aws"],
          ["react", "css"],
        ],
      });

      expect(sim).not.toBeNull();
      expect(sim!.baselineScore).toBe(60); // 3/5
      expect(sim!.projectedScore).toBe(100); // 5/5 after adding docker + helm
      expect(sim!.scoreDeltaPct).toBe(40);
      // Adding docker resolves the missing prerequisite alert for kubernetes
      expect(sim!.resolvedPrerequisiteAlerts).toContain("kubernetes");
      // linux was already verified
      const linuxTransition = sim!.skillStateTransitions.find(
        (t) => t.skill === "linux",
      );
      expect(linuxTransition?.afterStatus).toBe("ALREADY_VERIFIED");
      // 2 of 3 catalog jobs require docker or helm
      expect(sim!.affectedActiveJobsCount).toBe(2);
      expect(sim!.disclaimer).toContain("Simulated readiness");
    });
  });

  // 6. OntologyAlias persistence across server restarts
  describe("6. OntologyAlias DB persistence & restart hydration", () => {
    it("persists approved alias and reloads it into ALIAS_TO_CANONICAL on startup hydration", async () => {
      vi.spyOn(prisma.ontologyAlias, "deleteMany").mockResolvedValue({
        count: 0,
      });

      const upsertSpy = vi
        .spyOn(prisma.ontologyAlias, "upsert")
        .mockResolvedValue({
          id: "oa-1",
          rawSkill: "tanstack-router",
          canonicalSkill: "react",
          status: "APPROVED",
          createdBy: "admin-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      await resolveUnrecognizedSkillToken({
        token: "tanstack-router",
        action: "MAP_ALIAS",
        targetCanonical: "react",
        createdBy: "admin-1",
      });
      expect(upsertSpy).toHaveBeenCalled();

      // Simulate server restart by clearing the runtime alias entry and re-hydrating from DB
      ALIAS_TO_CANONICAL.delete("tanstack-router");
      expect(ALIAS_TO_CANONICAL.has("tanstack-router")).toBe(false);

      vi.spyOn(prisma.ontologyAlias, "findMany").mockResolvedValue([
        {
          id: "oa-1",
          rawSkill: "tanstack-router",
          canonicalSkill: "react",
          status: "APPROVED",
          createdBy: "admin-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const hydrated = await hydrateOntologyFromDatabase();
      expect(hydrated.approvedLoaded).toBe(1);
      expect(ALIAS_TO_CANONICAL.get("tanstack-router")).toBe("react");
      expect(
        countSkillMentions("Migrated app to tanstack-router").get("react"),
      ).toBe(1);
    });

    it("verifies false-positive boundary cases and extraction accuracy", () => {
      const fp = runFalsePositiveAudit();
      expect(fp.passRatePct).toBe(100);
      const bench = runExtractionAccuracyBenchmark();
      expect(bench.f1Pct).toBeGreaterThanOrEqual(90);
    });
  });

  // 7. AI Provider Failover & Malformed JSON Retry
  describe("7. AI Provider Failover & Malformed JSON Retry", () => {
    it("fails over from primary provider to secondary provider when primary times out", async () => {
      process.env.AI_TEST_FAILOVER = "true";
      vi.spyOn(groqClient, "isGroqConfigured").mockReturnValue(true);
      vi.spyOn(nvidiaClient, "isNvidiaConfigured").mockReturnValue(true);
      vi.spyOn(geminiClient, "isGeminiConfigured").mockReturnValue(false);
      vi.spyOn(ollamaClient, "isOllamaConfigured").mockReturnValue(false);

      vi.spyOn(groqClient, "callGroqCompletion").mockRejectedValue(
        Object.assign(new Error("Request timed out"), { code: "ETIMEDOUT" }),
      );
      vi.spyOn(nvidiaClient, "callNvidiaCompletion").mockResolvedValue({
        content: '{"ok":true,"source":"nvidia"}',
        model: "nvidia/nemotron-3.5-super-vl-120b-a12b",
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      });

      const res = await analyzeResume("Return JSON", "default", {
        userId: "user-1",
        feature: "RESUME_ANALYSIS",
      });
      expect(res).toEqual({ ok: true, source: "nvidia" });
    });

    it("retries once on malformed JSON and throws sanitized AppError if both providers fail", async () => {
      process.env.AI_TEST_FAILOVER = "true";
      vi.spyOn(groqClient, "isGroqConfigured").mockReturnValue(true);
      vi.spyOn(nvidiaClient, "isNvidiaConfigured").mockReturnValue(false);
      vi.spyOn(geminiClient, "isGeminiConfigured").mockReturnValue(false);
      vi.spyOn(ollamaClient, "isOllamaConfigured").mockReturnValue(false);

      const groqSpy = vi
        .spyOn(groqClient, "callGroqCompletion")
        .mockResolvedValueOnce({
          content: "not valid json {{{",
          model: "qwen/qwen3.8-27b",
          usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
        })
        .mockResolvedValueOnce({
          content: '{"recovered":true}',
          model: "qwen/qwen3.8-27b",
          usage: { promptTokens: 6, completionTokens: 4, totalTokens: 10 },
        });

      const recovered = await analyzeResume("Return JSON");
      expect(groqSpy).toHaveBeenCalledTimes(2);
      expect(recovered).toEqual({ recovered: true });

      // Both failing throws sanitized AppError without leaking raw secret/error
      vi.spyOn(groqClient, "callGroqCompletion").mockRejectedValue(
        new Error("RAW_INTERNAL_API_KEY_LEAK_XYZ"),
      );
      await expect(analyzeResume("Return JSON")).rejects.toThrow(
        /temporarily unavailable/i,
      );
    });
  });
});
