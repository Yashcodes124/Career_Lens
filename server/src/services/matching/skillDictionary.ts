// Canonical skills and the aliases that point to them.
// Aliases are matched as whole words, so "javascript" never counts as "java"
// and "digital" never counts as "git".
export interface SkillEntry {
  canonical: string;
  aliases: string[];
}

export const SKILL_DICTIONARY: SkillEntry[] = [
  // Core 44 skills (preserved for backward compatibility with unit tests)
  {
    canonical: "javascript",
    aliases: ["javascript", "js", "ecmascript", "es6"],
  },
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
  {
    canonical: "tailwind css",
    aliases: ["tailwind css", "tailwindcss", "tailwind"],
  },
  { canonical: "bootstrap", aliases: ["bootstrap"] },
  { canonical: "sql", aliases: ["sql"] },
  {
    canonical: "postgresql",
    aliases: ["postgresql", "postgres", "postgre sql"],
  },
  { canonical: "mysql", aliases: ["mysql"] },
  { canonical: "mongodb", aliases: ["mongodb", "mongo"] },
  { canonical: "prisma", aliases: ["prisma", "prisma orm"] },
  { canonical: "docker", aliases: ["docker"] },
  { canonical: "kubernetes", aliases: ["kubernetes", "k8s"] },
  { canonical: "git", aliases: ["git"] },
  { canonical: "github", aliases: ["github"] },
  { canonical: "aws", aliases: ["aws", "amazon web services"] },
  { canonical: "azure", aliases: ["azure", "microsoft azure"] },
  {
    canonical: "gcp",
    aliases: ["gcp", "google cloud", "google cloud platform"],
  },
  { canonical: "linux", aliases: ["linux", "unix"] },
  {
    canonical: "rest api",
    aliases: ["rest api", "rest apis", "restful api", "restful apis"],
  },
  { canonical: "graphql", aliases: ["graphql"] },
  { canonical: "redis", aliases: ["redis"] },
  { canonical: "spring boot", aliases: ["spring boot", "springboot"] },
  { canonical: "django", aliases: ["django"] },
  { canonical: "fastapi", aliases: ["fastapi", "fast api"] },
  { canonical: "jest", aliases: ["jest"] },
  { canonical: "vitest", aliases: ["vitest"] },
  { canonical: "machine learning", aliases: ["machine learning", "ml"] },
  {
    canonical: "data structures",
    aliases: ["data structures", "data structure", "dsa"],
  },
  { canonical: "algorithms", aliases: ["algorithms", "algorithm"] },
  {
    canonical: "system design",
    aliases: ["system design", "high level design", "low level design"],
  },
  { canonical: "agile", aliases: ["agile", "scrum", "kanban"] },
  {
    canonical: "ci/cd",
    aliases: [
      "ci/cd",
      "ci cd",
      "continuous integration",
      "continuous delivery",
    ],
  },

  // Expanded Software Engineering Languages
  { canonical: "rust", aliases: ["rust", "rustlang"] },
  { canonical: "kotlin", aliases: ["kotlin"] },
  { canonical: "swift", aliases: ["swift"] },
  { canonical: "scala", aliases: ["scala"] },
  { canonical: "ruby", aliases: ["ruby"] },
  { canonical: "php", aliases: ["php"] },
  { canonical: "dart", aliases: ["dart"] },
  { canonical: "bash", aliases: ["bash", "shell scripting"] },

  // Expanded Frontend & Mobile Ecosystem
  { canonical: "redux", aliases: ["redux", "redux toolkit"] },
  { canonical: "react native", aliases: ["react native"] },
  { canonical: "flutter", aliases: ["flutter"] },
  { canonical: "svelte", aliases: ["svelte", "sveltekit"] },
  { canonical: "nuxt.js", aliases: ["nuxt.js", "nuxtjs", "nuxt"] },
  { canonical: "sass", aliases: ["sass", "scss"] },
  { canonical: "webpack", aliases: ["webpack"] },
  { canonical: "vite", aliases: ["vite"] },
  { canonical: "three.js", aliases: ["three.js", "threejs", "webgl"] },
  { canonical: "react query", aliases: ["react query", "tanstack query"] },

  // Expanded Backend Frameworks & Protocols
  { canonical: "nestjs", aliases: ["nestjs", "nest.js"] },
  { canonical: "flask", aliases: ["flask"] },
  { canonical: "ruby on rails", aliases: ["ruby on rails", "rails"] },
  { canonical: ".net", aliases: [".net", "dotnet", "asp.net", ".net core"] },
  { canonical: "laravel", aliases: ["laravel"] },
  { canonical: "hibernate", aliases: ["hibernate", "jpa"] },
  { canonical: "grpc", aliases: ["grpc", "protobuf", "protocol buffers"] },
  { canonical: "websocket", aliases: ["websocket", "websockets", "socket.io"] },
  { canonical: "webrtc", aliases: ["webrtc"] },
  {
    canonical: "microservices",
    aliases: ["microservices", "microservice", "microservice architecture"],
  },
  {
    canonical: "distributed systems",
    aliases: ["distributed systems", "distributed system"],
  },
  {
    canonical: "event-driven architecture",
    aliases: ["event-driven", "event driven architecture"],
  },

  // Expanded Databases, Caching & Messaging
  { canonical: "sqlite", aliases: ["sqlite", "sqlite3"] },
  { canonical: "oracle", aliases: ["oracle db", "pl/sql"] },
  { canonical: "dynamodb", aliases: ["dynamodb", "aws dynamodb"] },
  { canonical: "cassandra", aliases: ["cassandra", "apache cassandra"] },
  {
    canonical: "elasticsearch",
    aliases: ["elasticsearch", "elastic search", "opensearch"],
  },
  { canonical: "neo4j", aliases: ["neo4j"] },
  { canonical: "supabase", aliases: ["supabase"] },
  { canonical: "firebase", aliases: ["firebase", "firestore"] },
  { canonical: "typeorm", aliases: ["typeorm"] },
  { canonical: "sequelize", aliases: ["sequelize"] },
  { canonical: "drizzle", aliases: ["drizzle", "drizzle orm"] },
  { canonical: "kafka", aliases: ["kafka", "apache kafka"] },
  { canonical: "rabbitmq", aliases: ["rabbitmq", "rabbit mq"] },
  { canonical: "celery", aliases: ["celery"] },

  // Expanded Cloud, DevOps, IaC & Observability
  { canonical: "terraform", aliases: ["terraform", "iac"] },
  { canonical: "ansible", aliases: ["ansible"] },
  { canonical: "helm", aliases: ["helm", "helm charts"] },
  { canonical: "jenkins", aliases: ["jenkins"] },
  { canonical: "github actions", aliases: ["github actions"] },
  { canonical: "gitlab ci", aliases: ["gitlab ci", "gitlab ci/cd"] },
  { canonical: "nginx", aliases: ["nginx"] },
  { canonical: "apache", aliases: ["apache http"] },
  { canonical: "cloudflare", aliases: ["cloudflare", "cloudflare workers"] },
  { canonical: "vercel", aliases: ["vercel"] },
  { canonical: "serverless", aliases: ["serverless", "aws lambda", "lambda"] },
  { canonical: "prometheus", aliases: ["prometheus"] },
  { canonical: "grafana", aliases: ["grafana"] },
  { canonical: "datadog", aliases: ["datadog"] },
  { canonical: "sentry", aliases: ["sentry"] },
  { canonical: "opentelemetry", aliases: ["opentelemetry", "otel"] },

  // Expanded Testing & QA Automation
  { canonical: "playwright", aliases: ["playwright"] },
  { canonical: "cypress", aliases: ["cypress"] },
  { canonical: "selenium", aliases: ["selenium", "webdriver"] },
  { canonical: "pytest", aliases: ["pytest"] },
  { canonical: "junit", aliases: ["junit", "mockito"] },
  { canonical: "postman", aliases: ["postman"] },
  {
    canonical: "unit testing",
    aliases: ["unit testing", "unit tests", "tdd", "test-driven development"],
  },

  // Expanded Data Engineering & AI/ML
  { canonical: "deep learning", aliases: ["deep learning", "neural networks"] },
  { canonical: "nlp", aliases: ["nlp", "natural language processing"] },
  {
    canonical: "llm",
    aliases: ["llm", "llms", "large language models", "generative ai", "genai"],
  },
  {
    canonical: "rag",
    aliases: ["rag", "retrieval augmented generation", "langchain"],
  },
  { canonical: "pytorch", aliases: ["pytorch"] },
  { canonical: "tensorflow", aliases: ["tensorflow", "keras"] },
  { canonical: "scikit-learn", aliases: ["scikit-learn", "sklearn"] },
  { canonical: "pandas", aliases: ["pandas"] },
  { canonical: "numpy", aliases: ["numpy"] },
  { canonical: "spark", aliases: ["spark", "apache spark", "pyspark"] },
  { canonical: "airflow", aliases: ["airflow", "apache airflow"] },
  { canonical: "snowflake", aliases: ["snowflake"] },
  { canonical: "bigquery", aliases: ["bigquery", "google bigquery"] },

  // Security & Core CS Principles
  { canonical: "oauth", aliases: ["oauth", "oauth2", "oauth 2.0", "oidc"] },
  { canonical: "jwt", aliases: ["jwt", "json web token", "json web tokens"] },
  {
    canonical: "cybersecurity",
    aliases: ["cybersecurity", "application security", "appsec", "owasp"],
  },
  {
    canonical: "object-oriented programming",
    aliases: ["object-oriented programming", "oop", "oops"],
  },
];

// Alias (lowercase) -> canonical name, including each canonical name itself.
export const ALIAS_TO_CANONICAL: ReadonlyMap<string, string> = new Map(
  SKILL_DICTIONARY.flatMap((entry) => [
    [entry.canonical, entry.canonical] as const,
    ...entry.aliases.map((alias) => [alias, entry.canonical] as const),
  ]),
);

const escapeRegex = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
