//server/src/services/matching/jobSkillExtractor.ts

import { normalizeSkill } from "./skillNormalizer";

//Known skills Dictionary
const knownSkills = [
  "javascript",
  "typescript",
  "java",
  "python",
  "c++",
  "c#",
  "react",
  "angular",
  "vue",
  "next.js",
  "node.js",
  "express.js",
  "html",
  "css",
  "tailwind css",
  "bootstrap",
  "sql",
  "postgresql",
  "mysql",
  "mongodb",
  "prisma",
  "docker",
  "kubernetes",
  "git",
  "github",
  "aws",
  "azure",
  "gcp",
  "rest api",
  "graphql",
  "redis",
  "spring boot",
  "django",
  "fastapi",
  "machine learning",
  "data structures",
  "algorithms",
  "system design",
];


export const extractJobSkills = (description: string): string[] => {
  const text = description.toLowerCase();

  const foundSkills = knownSkills.filter((skill) => {
    const normalizedSkill = skill.toLowerCase();

    return text.includes(normalizedSkill);
  });

  return [...new Set(foundSkills.map(normalizeSkill))];
};
