import { describe, expect, it } from "vitest";
import {
  ALL_SKILL_FAMILIES,
  SKILL_DICTIONARY,
  analyzeSkillPrerequisiteReadiness,
  countSkillMentions,
  getSkillPrerequisites,
  runExtractionAccuracyBenchmark,
  runFalsePositiveAudit,
} from "../services/matching/skillDictionary";
import {
  evaluateSenioritySkillAlignment,
  normalizeSkill,
} from "../services/matching/skillNormalizer";

describe("P1.14 Expanded Skill Ontology & Quality Guardrails", () => {
  it("contains at least 300 canonical skills across all 9 required engineering families", () => {
    expect(SKILL_DICTIONARY.length).toBeGreaterThanOrEqual(300);

    const familiesPresent = new Set(SKILL_DICTIONARY.map((s) => s.family));
    for (const family of ALL_SKILL_FAMILIES) {
      expect(familiesPresent.has(family)).toBe(true);
    }
  });

  it("normalizes acronyms and aliases deterministically", () => {
    expect(normalizeSkill("k8s")).toBe("kubernetes");
    expect(normalizeSkill("IaC")).toBe("terraform");
    expect(normalizeSkill("OIDC")).toBe("oauth");
    expect(normalizeSkill("Retrieval Augmented Generation")).toBe("rag");
    expect(normalizeSkill("TANSTACK QUERY")).toBe("react query");
  });

  it("passes 100% of false-positive whole-word boundary cases", () => {
    const audit = runFalsePositiveAudit();
    expect(audit.passRatePct).toBe(100);
  });

  it("enforces skill prerequisite relationships (e.g., Kubernetes requires Docker/Linux/Networking)", () => {
    const k8sPrereqs = getSkillPrerequisites("kubernetes");
    expect(k8sPrereqs).toEqual(
      expect.arrayContaining(["docker", "linux", "networking"]),
    );

    const alerts = analyzeSkillPrerequisiteReadiness(
      ["kubernetes", "rag"],
      ["python"],
    );
    expect(alerts.length).toBe(2);
    expect(alerts[0].missingPrerequisites).toContain("docker");
  });

  it("evaluates seniority-aware skill alignment for Senior/Staff vs Junior roles", () => {
    const seniorGap = evaluateSenioritySkillAlignment({
      jobTitle: "Senior Distributed Systems Engineer",
      candidateExperienceYrs: 1,
      requiredSkills: [
        "go",
        "kubernetes",
        "distributed systems",
        "microservices",
      ],
      matchedSkills: ["go"],
    });
    expect(seniorGap.targetSeniority).toBe("SENIOR");
    expect(seniorGap.seniorityAligned).toBe(false);
    expect(seniorGap.seniorityBonusOrPenaltyPct).toBeLessThan(0);
  });

  it("achieves >= 90% F1 extraction accuracy on multi-domain job descriptions", () => {
    const benchmark = runExtractionAccuracyBenchmark();
    expect(benchmark.f1Pct).toBeGreaterThanOrEqual(90);
    expect(
      countSkillMentions("Built K8s clusters with Helm").get("kubernetes"),
    ).toBe(1);
  });
});
