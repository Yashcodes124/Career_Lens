// Canonical skills and the aliases that point to them.
// Aliases are matched as whole words, so "javascript" never counts as "java"
// and "digital" never counts as "git".
export interface SkillEntry {
  canonical: string;
  aliases: string[];
}

export const SKILL_DICTIONARY: SkillEntry[] = [
  { canonical: "javascript", aliases: ["javascript", "js", "ecmascript", "es6"] },
  { canonical: "typescript", aliases: ["typescript", "ts"] },
  { canonical: "java", aliases: ["java"] },
  { canonical: "python", aliases: ["python"] },
  { canonical: "c++", aliases: ["c++", "cpp"] },
  { canonical: "c#", aliases: ["c#", "csharp", "c sharp"] },
  { canonical: "go", aliases: ["golang"] },
  { canonical: "react", aliases: ["react", "reactjs", "react.js"] },
  { canonical: "angular", aliases: ["angular", "angularjs"] },
  { canonical: "vue", aliases: ["vue", "vuejs", "vue.js"] },
  { canonical: "next.js", aliases: ["next.js", "nextjs", "next js"] },
  { canonical: "node.js", aliases: ["node.js", "nodejs", "node"] },
  { canonical: "express.js", aliases: ["express.js", "expressjs"] },
  { canonical: "html", aliases: ["html", "html5"] },
  { canonical: "css", aliases: ["css", "css3"] },
  { canonical: "tailwind css", aliases: ["tailwind css", "tailwindcss", "tailwind"] },
  { canonical: "bootstrap", aliases: ["bootstrap"] },
  { canonical: "sql", aliases: ["sql"] },
  { canonical: "postgresql", aliases: ["postgresql", "postgres", "postgre sql"] },
  { canonical: "mysql", aliases: ["mysql"] },
  { canonical: "mongodb", aliases: ["mongodb", "mongo"] },
  { canonical: "prisma", aliases: ["prisma", "prisma orm"] },
  { canonical: "docker", aliases: ["docker"] },
  { canonical: "kubernetes", aliases: ["kubernetes", "k8s"] },
  { canonical: "git", aliases: ["git"] },
  { canonical: "github", aliases: ["github"] },
  { canonical: "aws", aliases: ["aws", "amazon web services"] },
  { canonical: "azure", aliases: ["azure"] },
  { canonical: "gcp", aliases: ["gcp", "google cloud"] },
  { canonical: "linux", aliases: ["linux"] },
  { canonical: "rest api", aliases: ["rest api", "rest apis", "restful api", "restful apis"] },
  { canonical: "graphql", aliases: ["graphql"] },
  { canonical: "redis", aliases: ["redis"] },
  { canonical: "spring boot", aliases: ["spring boot"] },
  { canonical: "django", aliases: ["django"] },
  { canonical: "fastapi", aliases: ["fastapi"] },
  { canonical: "jest", aliases: ["jest"] },
  { canonical: "vitest", aliases: ["vitest"] },
  { canonical: "machine learning", aliases: ["machine learning"] },
  { canonical: "data structures", aliases: ["data structures", "data structure"] },
  { canonical: "algorithms", aliases: ["algorithms", "algorithm"] },
  { canonical: "system design", aliases: ["system design"] },
  { canonical: "agile", aliases: ["agile", "scrum"] },
  { canonical: "ci/cd", aliases: ["ci/cd", "ci cd"] },
];

// Alias (lowercase) -> canonical name, including each canonical name itself.
export const ALIAS_TO_CANONICAL: ReadonlyMap<string, string> = new Map(
  SKILL_DICTIONARY.flatMap((entry) => [
    [entry.canonical, entry.canonical] as const,
    ...entry.aliases.map((alias) => [alias, entry.canonical] as const),
  ]),
);

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// One pattern per skill: all its names as a single alternation, longest first,
// so "Node.js" counts once as node.js and not again as "node".
const SEARCH_PATTERNS: ReadonlyArray<{ canonical: string; pattern: RegExp }> =
  SKILL_DICTIONARY.map((entry) => {
    const names = [...new Set([entry.canonical, ...entry.aliases])].sort(
      (a, b) => b.length - a.length,
    );
    const alternation = names.map(escapeRegex).join("|");
    return {
      canonical: entry.canonical,
      // Whole-word boundaries that still work for names ending in symbols, such as "c++".
      pattern: new RegExp(`(?<![a-z0-9])(?:${alternation})(?![a-z0-9])`, "g"),
    };
  });

// Counts how many times each canonical skill is named in free text.
export const countSkillMentions = (text: string): Map<string, number> => {
  const lower = text.toLowerCase().replace(/[\u2018\u2019]/g, "'");
  const counts = new Map<string, number>();

  for (const { canonical, pattern } of SEARCH_PATTERNS) {
    const hits = lower.match(pattern)?.length ?? 0;
    if (hits > 0) {
      counts.set(canonical, (counts.get(canonical) ?? 0) + hits);
    }
  }
  return counts;
};
