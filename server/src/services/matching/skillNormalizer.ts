// Turns any skill string into its canonical form, e.g. "  ReactJS " -> "react".
// Skills outside the dictionary keep their cleaned lowercase form, so exact matches still work.
import { ALIAS_TO_CANONICAL } from "./skillDictionary";

export const normalizeSkill = (skill: string): string => {
  const cleaned = skill
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\s,;:]+$/g, "")
    .trim();

  return ALIAS_TO_CANONICAL.get(cleaned) ?? cleaned;
};

export const normalizeSkills = (skills: string[]): string[] => {
  const unique = new Set<string>();
  for (const skill of skills) {
    const normalized = normalizeSkill(skill);
    if (normalized) unique.add(normalized);
  }
  return [...unique];
};
