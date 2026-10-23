import { describe, expect, it } from "vitest";
import { skillEvidenceFromReport } from "../services/skills/skillEvidence";
import { decideNextAction } from "../services/readiness/nextAction";
import { calculateMatch } from "../services/matching/matchingService";

describe("interview report to skill evidence", () => {
  it("marks skills named under improvements as WEAK and strengths as STRONG", () => {
    const result = skillEvidenceFromReport({
      strengths: ["Clear explanations of React state"],
      improvements: ["Docker deployment answers were vague"],
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ skill: "docker", status: "WEAK" }),
        expect.objectContaining({ skill: "react", status: "STRONG" }),
      ]),
    );
  });

  it("treats a skill named under both headings as WEAK, the cautious reading", () => {
    const result = skillEvidenceFromReport({
      strengths: ["Good SQL joins"],
      improvements: ["SQL indexing was shaky"],
    });

    expect(result).toEqual([expect.objectContaining({ skill: "sql", status: "WEAK" })]);
  });

  it("ignores phrases that are not in the skill dictionary", () => {
    const result = skillEvidenceFromReport({
      strengths: ["Calm under pressure"],
      improvements: ["Could be more concise"],
    });

    expect(result).toEqual([]);
  });
});

describe("next action", () => {
  const none = { hasResume: true, weakSkills: [], hasScoredApplication: true };

  it("asks for a resume first", () => {
    expect(decideNextAction({ ...none, hasResume: false }).type).toBe("UPLOAD_RESUME");
  });

  it("practises the most recent weak skill before anything else", () => {
    const action = decideNextAction({
      ...none,
      weakSkills: [
        { skill: "docker", evidence: "e1" },
        { skill: "aws", evidence: "e2" },
      ],
    });
    expect(action).toMatchObject({ type: "PRACTICE_SKILL", skill: "docker" });
  });

  it("explores jobs when nothing has been matched yet", () => {
    expect(decideNextAction({ ...none, hasScoredApplication: false }).type).toBe("EXPLORE_JOBS");
  });

  it("otherwise suggests an interview", () => {
    expect(decideNextAction(none).type).toBe("START_INTERVIEW");
  });
});

describe("closed loop in matching", () => {
  const description = "Docker. Docker. Docker. AWS.";

  it("a skill flagged WEAK in an interview is not credited, even when the resume lists it", () => {
    const result = calculateMatch(["React", "Docker"], ["React", "Docker"], description, {
      strongSkills: [],
      weakSkills: new Map([["docker", "Named under improvements in a mock interview report"]]),
    });

    expect(result.matchedSkills).toEqual(["react"]);
    expect(result.skillGaps[0]).toEqual({
      skill: "docker",
      priority: "high",
      evidence: "Weak in a mock interview. Practise it before the next interview.",
    });
    expect(result.score).toBe(50);
  });

  it("a skill STRONG in an interview is credited even when the resume does not list it", () => {
    const result = calculateMatch(["React"], ["React", "Docker"], description, {
      strongSkills: ["docker"],
      weakSkills: new Map(),
    });

    expect(result.matchedSkills).toEqual(["react", "docker"]);
    expect(result.score).toBe(100);
  });
});
