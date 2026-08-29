//server/src/services/matching/skillNormalizer.ts

// Raw Skill String ("  reACTJS.  ")
//    │
//    ▼
// [Tier 1: Lowercase & Clean] ──► "reactjs"
//    │
//    ▼
// [Tier 2: Lookup in Alias Map] ──► Found! Returns Canonical: "React"
//    │ (If Not Found)
//    ▼
// [Tier 3: LLM Canonicalization & DB Upsert] ──► Returns & Stores New Canonical Skill
//LowerCasing , Punctuation cleaning, Whiete sapce trimming

const skillAliases: Record<string, string> = {
  js: "javascript",
  javascript: "javascript",
  "javascript es6": "javascript",
  ts: "typescript",
  typescript: "typescript",

  react: "react",
  "react.js": "react",
  reactjs: "react",

  node: "node.js",
  nodejs: "node.js",
  "node.js": "node.js",

  express: "express.js",
  expressjs: "express.js",
  "express.js": "express.js",

  postgres: "postgresql",
  postgresql: "postgresql",
  "postgre sql": "postgresql",

  prisma: "prisma",

  html: "html",
  html5: "html",

  css: "css",
  css3: "css",

  docker: "docker",

  java: "java",

  python: "python",

  sql: "sql",

  git: "git",
  github: "github",
};

//normalize a single skill
export const normalizeSkill = (skill: string): string => {
  const normalized = skill.trim().toLowerCase().replace(
    "/\
        s +/g ",
    "",
  );
  return skillAliases[normalized] ?? normalized;
};

////normalize a list of skil
export const normalizeSkills = (skills: string[]): string[] => {
  return [
    ...new Set(
      skills.filter((skill) => skill.trim().length > 0).map(normalizeSkill),
    ),
  ];
};
