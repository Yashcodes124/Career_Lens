import { describe, expect, it } from "vitest";
import { parseModelJson } from "../utils/parseModelJson";

describe("parseModelJson", () => {
  it("parses plain JSON", () => {
    expect(parseModelJson('{"skills":["React"]}')).toEqual({ skills: ["React"] });
  });

  it("removes markdown code fences", () => {
    const content = "```json\n{\"skills\":[\"Go\"]}\n```";
    expect(parseModelJson(content)).toEqual({ skills: ["Go"] });
  });

  it("ignores prose before and after the object", () => {
    const content = 'Here is the result: {"summary":"Engineer"} Hope this helps.';
    expect(parseModelJson(content)).toEqual({ summary: "Engineer" });
  });

  it("removes reasoning blocks before parsing", () => {
    const content = "<think>The resume mentions React.</think>{\"skills\":[\"React\"]}";
    expect(parseModelJson(content)).toEqual({ skills: ["React"] });
  });

  it("throws when there is no JSON object", () => {
    expect(() => parseModelJson("I could not read this resume.")).toThrow(
      "No JSON object found",
    );
  });

  it("throws on malformed JSON", () => {
    expect(() => parseModelJson('{"skills": [}')).toThrow();
  });
});
