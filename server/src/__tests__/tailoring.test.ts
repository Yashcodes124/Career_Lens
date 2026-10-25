import { describe, expect, it } from "vitest";
import { buildTailoringSuggestions } from "../services/tailoring/tailoringService";

const job = {
  title: "Backend Engineer",
  requirements: ["react", "docker", "aws", "kubernetes"],
  description: "Run services in Docker. Docker images are built in CI. Docker and AWS in production.",
};

describe("buildTailoringSuggestions", () => {
  it("suggests adding a skill only when the resume text already mentions it", () => {
    const result = buildTailoringSuggestions(
      {
        skills: ["React"],
        rawText: "Built CI pipelines using Docker. Frontend work in React.",
      },
      job,
    );

    expect(result.addToSkills.map((s) => s.skill)).toEqual(["docker"]);
    expect(result.addToSkills[0].evidence).toContain("mentions docker 1 time");
    expect(result.suggestedSkills).toEqual(["React", "docker"]);
  });

  it("lists skills the resume never mentions as gaps, never as additions", () => {
    const result = buildTailoringSuggestions(
      { skills: ["React"], rawText: "Frontend work in React." },
      job,
    );

    const gapNames = result.notOnResume.map((g) => g.skill);
    expect(gapNames).toEqual(expect.arrayContaining(["docker", "aws", "kubernetes"]));
    expect(result.addToSkills).toEqual([]);
    expect(result.suggestedSkills).not.toContain("kubernetes");
    expect(result.suggestedSkills).not.toContain("aws");
  });

  it("ranks gaps by how often the posting names them", () => {
    const result = buildTailoringSuggestions({ skills: [], rawText: "" }, job);
    expect(result.notOnResume[0]).toMatchObject({ skill: "docker", priority: "high" });
  });

  it("does not repeat skills the candidate already lists", () => {
    const result = buildTailoringSuggestions(
      { skills: ["React", "docker"], rawText: "Built with Docker and React." },
      job,
    );
    expect(result.addToSkills.map((s) => s.skill)).not.toContain("docker");
    expect(result.suggestedSkills.filter((s) => s.toLowerCase() === "docker")).toHaveLength(1);
  });
});
