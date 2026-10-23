// Finds canonical skills named in a job description (used at sync time).
import { countSkillMentions } from "./skillDictionary";

export const extractJobSkills = (description: string): string[] => {
  return [...countSkillMentions(description).keys()];
};
