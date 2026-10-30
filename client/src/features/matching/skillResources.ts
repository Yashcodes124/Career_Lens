export interface SkillResourceLink {
  title: string;
  provider: string;
  type: "DOCS" | "ROADMAP" | "PRACTICE" | "COURSE";
  url: string;
  durationOrLevel: string;
}

const CURATED_SKILL_MAP: Record<string, SkillResourceLink[]> = {
  react: [
    {
      title: "React Official Interactive Docs (react.dev)",
      provider: "React Team",
      type: "DOCS",
      url: "https://react.dev/learn",
      durationOrLevel: "Core & Hooks",
    },
    {
      title: "React Developer Roadmap & Patterns",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/react",
      durationOrLevel: "Interactive Path",
    },
    {
      title: "Frontend & React Coding Challenges",
      provider: "GreatFrontEnd",
      type: "PRACTICE",
      url: "https://www.greatfrontend.com/prepare/coding",
      durationOrLevel: "Hands-on Labs",
    },
  ],
  typescript: [
    {
      title: "The TypeScript Handbook",
      provider: "Microsoft",
      type: "DOCS",
      url: "https://www.typescriptlang.org/docs/handbook/intro.html",
      durationOrLevel: "Official Guide",
    },
    {
      title: "Total TypeScript Free Tutorials",
      provider: "Total TypeScript",
      type: "PRACTICE",
      url: "https://www.totaltypescript.com/tutorials",
      durationOrLevel: "Interactive Exercises",
    },
    {
      title: "TypeScript Skill Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/typescript",
      durationOrLevel: "Step-by-step",
    },
  ],
  javascript: [
    {
      title: "Modern JavaScript Tutorial",
      provider: "javascript.info",
      type: "DOCS",
      url: "https://javascript.info/",
      durationOrLevel: "Fundamentals to Advanced",
    },
    {
      title: "MDN JavaScript Reference",
      provider: "Mozilla MDN",
      type: "DOCS",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      durationOrLevel: "Reference",
    },
    {
      title: "30 Days of JavaScript",
      provider: "LeetCode",
      type: "PRACTICE",
      url: "https://leetcode.com/studyplan/30-days-of-javascript/",
      durationOrLevel: "30 Problems",
    },
  ],
  java: [
    {
      title: "Dev.java Official Tutorials & JVM Guide",
      provider: "Oracle / Java",
      type: "DOCS",
      url: "https://dev.java/learn/",
      durationOrLevel: "Core Java & Collections",
    },
    {
      title: "Java Backend Developer Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/java",
      durationOrLevel: "Interactive Path",
    },
    {
      title: "NeetCode 150 (Java Solutions & DSA)",
      provider: "NeetCode",
      type: "PRACTICE",
      url: "https://neetcode.io/practice",
      durationOrLevel: "Interview Practice",
    },
  ],
  "spring boot": [
    {
      title: "Spring Boot Official Guides & Quickstarts",
      provider: "Spring.io",
      type: "DOCS",
      url: "https://spring.io/guides",
      durationOrLevel: "Hands-on Guides",
    },
    {
      title: "Spring Boot Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/spring-boot",
      durationOrLevel: "Architecture Path",
    },
    {
      title: "Baeldung Spring & JPA Tutorials",
      provider: "Baeldung",
      type: "COURSE",
      url: "https://www.baeldung.com/spring-boot",
      durationOrLevel: "Deep Dives",
    },
  ],
  "node.js": [
    {
      title: "Node.js Official Learn Path",
      provider: "OpenJS Foundation",
      type: "DOCS",
      url: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs",
      durationOrLevel: "Event Loop & Streams",
    },
    {
      title: "Node.js Backend Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/nodejs",
      durationOrLevel: "Interactive Path",
    },
    {
      title: "Node.js Production Best Practices",
      provider: "GitHub / Goldbergyoni",
      type: "PRACTICE",
      url: "https://github.com/goldbergyoni/nodebestpractices",
      durationOrLevel: "80+ Rules",
    },
  ],
  postgresql: [
    {
      title: "PostgreSQL Exercises (Interactive SQL)",
      provider: "pgexercises.com",
      type: "PRACTICE",
      url: "https://pgexercises.com/",
      durationOrLevel: "Interactive Queries",
    },
    {
      title: "PostgreSQL DBA & Indexing Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/postgresql-dba",
      durationOrLevel: "Indexing & ACID",
    },
    {
      title: "PostgreSQL Official Tutorial",
      provider: "PostgreSQL.org",
      type: "DOCS",
      url: "https://www.postgresql.org/docs/current/tutorial.html",
      durationOrLevel: "Official Docs",
    },
  ],
  sql: [
    {
      title: "SQLBolt Interactive Lessons",
      provider: "SQLBolt",
      type: "PRACTICE",
      url: "https://sqlbolt.com/",
      durationOrLevel: "20 Interactive Labs",
    },
    {
      title: "Top SQL 50 Interview Study Plan",
      provider: "LeetCode",
      type: "PRACTICE",
      url: "https://leetcode.com/studyplan/top-sql-50/",
      durationOrLevel: "50 Problems",
    },
    {
      title: "SQL Developer Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/sql",
      durationOrLevel: "Core Concepts",
    },
  ],
  docker: [
    {
      title: "Docker Official Get Started Guide",
      provider: "Docker Docs",
      type: "DOCS",
      url: "https://docs.docker.com/get-started/",
      durationOrLevel: "Containers & Compose",
    },
    {
      title: "Play with Docker (Browser Sandbox)",
      provider: "Docker Labs",
      type: "PRACTICE",
      url: "https://labs.play-with-docker.com/",
      durationOrLevel: "Free Cloud Lab",
    },
    {
      title: "Docker Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/docker",
      durationOrLevel: "Step-by-step",
    },
  ],
  kubernetes: [
    {
      title: "Kubernetes Basics Interactive Tutorial",
      provider: "Kubernetes.io",
      type: "DOCS",
      url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
      durationOrLevel: "Pods, Services & Deployments",
    },
    {
      title: "Kubernetes Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/kubernetes",
      durationOrLevel: "Cluster Architecture",
    },
    {
      title: "KillerCoda Interactive K8s Scenarios",
      provider: "Killercoda",
      type: "PRACTICE",
      url: "https://killercoda.com/playgrounds/scenario/kubernetes",
      durationOrLevel: "Live Terminal",
    },
  ],
  graphql: [
    {
      title: "Introduction to GraphQL Queries & Schemas",
      provider: "graphql.org",
      type: "DOCS",
      url: "https://graphql.org/learn/",
      durationOrLevel: "Official Spec",
    },
    {
      title: "Odyssey Interactive GraphQL Courses",
      provider: "Apollo GraphQL",
      type: "COURSE",
      url: "https://www.apollographql.com/tutorials/",
      durationOrLevel: "Free Labs",
    },
    {
      title: "GraphQL Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/graphql",
      durationOrLevel: "Resolvers & N+1",
    },
  ],
  redis: [
    {
      title: "Redis University & Official Docs",
      provider: "Redis.io",
      type: "DOCS",
      url: "https://redis.io/docs/latest/",
      durationOrLevel: "Caching & Pub/Sub",
    },
    {
      title: "Try Redis Interactive CLI",
      provider: "Redis.io",
      type: "PRACTICE",
      url: "https://redis.io/try-free/",
      durationOrLevel: "Hands-on",
    },
    {
      title: "Redis Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/redis",
      durationOrLevel: "Data Structures",
    },
  ],
  aws: [
    {
      title: "AWS Skill Builder Free Digital Training",
      provider: "Amazon Web Services",
      type: "COURSE",
      url: "https://explore.skillbuilder.aws/",
      durationOrLevel: "EC2, S3, IAM, RDS",
    },
    {
      title: "AWS Cloud Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/aws",
      durationOrLevel: "Architecture",
    },
    {
      title: "AWS Workshops (Hands-on Guides)",
      provider: "AWS Workshops",
      type: "PRACTICE",
      url: "https://workshops.aws/",
      durationOrLevel: "Self-paced Labs",
    },
  ],
  "system design": [
    {
      title: "The System Design Primer",
      provider: "GitHub / Donne Martin",
      type: "DOCS",
      url: "https://github.com/donnemartin/system-design-primer",
      durationOrLevel: "Scalability & Trade-offs",
    },
    {
      title: "System Design Interactive Roadmap",
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: "https://roadmap.sh/system-design",
      durationOrLevel: "Distributed Systems",
    },
    {
      title: "ByteByteGo System Design Guides",
      provider: "ByteByteGo",
      type: "COURSE",
      url: "https://blog.bytebytego.com/",
      durationOrLevel: "Case Studies",
    },
  ],
};

export const getResourcesForSkill = (rawSkill: string): SkillResourceLink[] => {
  const key = rawSkill.trim().toLowerCase();

  if (CURATED_SKILL_MAP[key]) {
    return CURATED_SKILL_MAP[key];
  }

  // Partial key match (e.g., "reactjs" -> "react", "postgres" -> "postgresql")
  for (const [knownKey, links] of Object.entries(CURATED_SKILL_MAP)) {
    if (key.includes(knownKey) || knownKey.includes(key)) {
      return links;
    }
  }

  const encoded = encodeURIComponent(rawSkill.trim());
  const slug = key.replace(/[^a-z0-9]+/g, "-");

  return [
    {
      title: `${rawSkill} Interactive Roadmap & Guides`,
      provider: "roadmap.sh",
      type: "ROADMAP",
      url: `https://roadmap.sh/search?q=${encoded}`,
      durationOrLevel: "Structured Path",
    },
    {
      title: `${rawSkill} Full Crash Course & Deep Dive`,
      provider: "freeCodeCamp / YouTube",
      type: "COURSE",
      url: `https://www.youtube.com/results?search_query=${encoded}+full+course+tutorial+for+developers`,
      durationOrLevel: "Video Tutorial",
    },
    {
      title: `${rawSkill} Open-Source Projects & Examples`,
      provider: "GitHub Topics",
      type: "PRACTICE",
      url: `https://github.com/topics/${slug}`,
      durationOrLevel: "Real Codebases",
    },
  ];
};
