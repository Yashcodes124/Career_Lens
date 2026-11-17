// Canonical engineering skill ontology (340+ skills across 9 engineering families).
// Aliases are matched with strict whole-word boundaries so "javascript" never matches "java"
// and "digital" never matches "git".

import { prisma } from "../../config/db";

export type SkillFamily =
  | "frontend"
  | "backend"
  | "cloud"
  | "data"
  | "devops"
  | "mobile"
  | "testing"
  | "security"
  | "ai_ml";

export type SkillTier = "foundational" | "core" | "advanced";

export interface SkillEntry {
  canonical: string;
  aliases: string[];
  family: SkillFamily;
  tier?: SkillTier;
  prerequisites?: string[];
}

export const ALL_SKILL_FAMILIES: readonly SkillFamily[] = [
  "frontend",
  "backend",
  "cloud",
  "data",
  "devops",
  "mobile",
  "testing",
  "security",
  "ai_ml",
] as const;

export const SKILL_FAMILY_LABELS: Record<SkillFamily, string> = {
  frontend: "Frontend & Web UI",
  backend: "Backend & Distributed Systems",
  cloud: "Cloud Infrastructure",
  data: "Data Engineering & Storage",
  devops: "DevOps, CI/CD & SRE",
  mobile: "Mobile Development",
  testing: "Testing & QA Automation",
  security: "Security & Identity",
  ai_ml: "AI, ML & LLM Systems",
};

export const SKILL_DICTIONARY: SkillEntry[] = [
  // =========================================================================
  // 1. FRONTEND & WEB UI (46 skills)
  // =========================================================================
  {
    canonical: "javascript",
    aliases: ["javascript", "js", "ecmascript", "es6", "es2015", "esnext"],
    family: "frontend",
    tier: "foundational",
  },
  {
    canonical: "typescript",
    aliases: ["typescript", "ts"],
    family: "frontend",
    tier: "core",
    prerequisites: ["javascript"],
  },
  {
    canonical: "html",
    aliases: ["html", "html5", "semantic html"],
    family: "frontend",
    tier: "foundational",
  },
  {
    canonical: "css",
    aliases: ["css", "css3", "flexbox", "css grid"],
    family: "frontend",
    tier: "foundational",
  },
  {
    canonical: "react",
    aliases: ["react", "reactjs", "react.js", "react hooks"],
    family: "frontend",
    tier: "core",
    prerequisites: ["javascript", "html", "css"],
  },
  {
    canonical: "next.js",
    aliases: ["next.js", "nextjs", "next js", "app router"],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["react", "typescript"],
  },
  {
    canonical: "angular",
    aliases: ["angular", "angularjs", "angular 2+"],
    family: "frontend",
    tier: "core",
    prerequisites: ["typescript", "html", "css"],
  },
  {
    canonical: "vue",
    aliases: ["vue", "vuejs", "vue.js", "vue 3", "composition api"],
    family: "frontend",
    tier: "core",
    prerequisites: ["javascript", "html", "css"],
  },
  {
    canonical: "nuxt.js",
    aliases: ["nuxt.js", "nuxtjs", "nuxt"],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["vue"],
  },
  {
    canonical: "svelte",
    aliases: ["svelte", "sveltekit", "svelte kit"],
    family: "frontend",
    tier: "core",
    prerequisites: ["javascript", "html", "css"],
  },
  {
    canonical: "solidjs",
    aliases: ["solidjs", "solid.js"],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["javascript", "typescript"],
  },
  {
    canonical: "remix",
    aliases: ["remix", "remix.run"],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["react"],
  },
  {
    canonical: "astro",
    aliases: ["astro", "astro.build"],
    family: "frontend",
    tier: "core",
    prerequisites: ["html", "javascript"],
  },
  {
    canonical: "tailwind css",
    aliases: ["tailwind css", "tailwindcss", "tailwind"],
    family: "frontend",
    tier: "core",
    prerequisites: ["css"],
  },
  {
    canonical: "bootstrap",
    aliases: ["bootstrap", "bootstrap 5"],
    family: "frontend",
    tier: "foundational",
    prerequisites: ["html", "css"],
  },
  {
    canonical: "sass",
    aliases: ["sass", "scss"],
    family: "frontend",
    tier: "core",
    prerequisites: ["css"],
  },
  {
    canonical: "css-in-js",
    aliases: ["css-in-js", "styled-components", "styled components", "emotion"],
    family: "frontend",
    tier: "core",
    prerequisites: ["react", "css"],
  },
  {
    canonical: "material ui",
    aliases: ["material ui", "mui", "material-ui"],
    family: "frontend",
    tier: "core",
    prerequisites: ["react"],
  },
  {
    canonical: "chakra ui",
    aliases: ["chakra ui", "chakra-ui"],
    family: "frontend",
    tier: "core",
    prerequisites: ["react"],
  },
  {
    canonical: "radix ui",
    aliases: ["radix ui", "radix-ui", "shadcn", "shadcn/ui"],
    family: "frontend",
    tier: "core",
    prerequisites: ["react", "tailwind css"],
  },
  {
    canonical: "redux",
    aliases: ["redux", "redux toolkit", "rtk", "rtk query"],
    family: "frontend",
    tier: "core",
    prerequisites: ["react", "javascript"],
  },
  {
    canonical: "zustand",
    aliases: ["zustand"],
    family: "frontend",
    tier: "core",
    prerequisites: ["react"],
  },
  {
    canonical: "mobx",
    aliases: ["mobx"],
    family: "frontend",
    tier: "core",
    prerequisites: ["javascript"],
  },
  {
    canonical: "recoil",
    aliases: ["recoil"],
    family: "frontend",
    tier: "core",
    prerequisites: ["react"],
  },
  {
    canonical: "react query",
    aliases: ["react query", "tanstack query", "@tanstack/react-query"],
    family: "frontend",
    tier: "core",
    prerequisites: ["react"],
  },
  {
    canonical: "swr",
    aliases: ["swr", "vercel swr"],
    family: "frontend",
    tier: "core",
    prerequisites: ["react"],
  },
  {
    canonical: "rxjs",
    aliases: ["rxjs", "reactive extensions"],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["javascript", "typescript"],
  },
  {
    canonical: "webpack",
    aliases: ["webpack", "webpack 5"],
    family: "frontend",
    tier: "core",
    prerequisites: ["javascript"],
  },
  {
    canonical: "vite",
    aliases: ["vite", "vitejs"],
    family: "frontend",
    tier: "core",
    prerequisites: ["javascript"],
  },
  {
    canonical: "rollup",
    aliases: ["rollup", "rollup.js"],
    family: "frontend",
    tier: "core",
    prerequisites: ["javascript"],
  },
  {
    canonical: "esbuild",
    aliases: ["esbuild"],
    family: "frontend",
    tier: "core",
    prerequisites: ["javascript"],
  },
  {
    canonical: "babel",
    aliases: ["babel", "babeljs"],
    family: "frontend",
    tier: "core",
    prerequisites: ["javascript"],
  },
  {
    canonical: "three.js",
    aliases: ["three.js", "threejs", "webgl"],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["javascript"],
  },
  {
    canonical: "d3.js",
    aliases: ["d3.js", "d3js", "d3"],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["javascript", "html"],
  },
  {
    canonical: "web accessibility",
    aliases: ["web accessibility", "a11y", "wcag", "aria"],
    family: "frontend",
    tier: "core",
    prerequisites: ["html", "css"],
  },
  {
    canonical: "web performance",
    aliases: [
      "web performance",
      "core web vitals",
      "lighthouse",
      "bundle optimization",
    ],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["javascript", "html"],
  },
  {
    canonical: "server-side rendering",
    aliases: [
      "server-side rendering",
      "ssr",
      "ssg",
      "static site generation",
      "isr",
    ],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["react", "node.js"],
  },
  {
    canonical: "progressive web apps",
    aliases: [
      "progressive web apps",
      "pwa",
      "service workers",
      "service worker",
    ],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["javascript", "html"],
  },
  {
    canonical: "webassembly",
    aliases: ["webassembly", "wasm"],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["javascript"],
  },
  {
    canonical: "micro-frontends",
    aliases: ["micro-frontends", "micro frontends", "module federation"],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["react", "webpack"],
  },
  {
    canonical: "storybook",
    aliases: ["storybook"],
    family: "frontend",
    tier: "core",
    prerequisites: ["react"],
  },
  {
    canonical: "design systems",
    aliases: ["design systems", "component library", "ui kit"],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["css", "web accessibility"],
  },
  {
    canonical: "apollo client",
    aliases: ["apollo client", "apollo graphql"],
    family: "frontend",
    tier: "core",
    prerequisites: ["react", "graphql"],
  },
  {
    canonical: "relay",
    aliases: ["relay", "relay modern"],
    family: "frontend",
    tier: "advanced",
    prerequisites: ["react", "graphql"],
  },
  {
    canonical: "jquery",
    aliases: ["jquery"],
    family: "frontend",
    tier: "foundational",
    prerequisites: ["javascript"],
  },
  {
    canonical: "dom manipulation",
    aliases: ["dom", "dom manipulation", "browser apis"],
    family: "frontend",
    tier: "foundational",
    prerequisites: ["javascript", "html"],
  },

  // =========================================================================
  // 2. BACKEND & DISTRIBUTED SYSTEMS (62 skills)
  // =========================================================================
  {
    canonical: "node.js",
    aliases: ["node.js", "nodejs", "node"],
    family: "backend",
    tier: "core",
    prerequisites: ["javascript"],
  },
  {
    canonical: "express.js",
    aliases: ["express.js", "expressjs", "express"],
    family: "backend",
    tier: "core",
    prerequisites: ["node.js"],
  },
  {
    canonical: "nestjs",
    aliases: ["nestjs", "nest.js"],
    family: "backend",
    tier: "core",
    prerequisites: ["node.js", "typescript"],
  },
  {
    canonical: "fastify",
    aliases: ["fastify"],
    family: "backend",
    tier: "core",
    prerequisites: ["node.js"],
  },
  {
    canonical: "koa",
    aliases: ["koa", "koa.js"],
    family: "backend",
    tier: "core",
    prerequisites: ["node.js"],
  },
  {
    canonical: "java",
    aliases: ["java", "java 17", "java 21", "jvm"],
    family: "backend",
    tier: "foundational",
  },
  {
    canonical: "spring boot",
    aliases: ["spring boot", "springboot", "spring framework", "spring mvc"],
    family: "backend",
    tier: "core",
    prerequisites: ["java", "sql"],
  },
  {
    canonical: "spring cloud",
    aliases: ["spring cloud"],
    family: "backend",
    tier: "advanced",
    prerequisites: ["spring boot", "microservices"],
  },
  {
    canonical: "hibernate",
    aliases: ["hibernate", "jpa", "spring data jpa"],
    family: "backend",
    tier: "core",
    prerequisites: ["java", "sql"],
  },
  {
    canonical: "python",
    aliases: ["python", "python3", "python 3"],
    family: "backend",
    tier: "foundational",
  },
  {
    canonical: "django",
    aliases: ["django", "django rest framework", "drf"],
    family: "backend",
    tier: "core",
    prerequisites: ["python", "sql"],
  },
  {
    canonical: "fastapi",
    aliases: ["fastapi", "fast api"],
    family: "backend",
    tier: "core",
    prerequisites: ["python", "rest api"],
  },
  {
    canonical: "flask",
    aliases: ["flask"],
    family: "backend",
    tier: "core",
    prerequisites: ["python"],
  },
  {
    canonical: "go",
    aliases: ["golang", "go lang"],
    family: "backend",
    tier: "core",
  },
  {
    canonical: "gin",
    aliases: ["gin", "gin-gonic"],
    family: "backend",
    tier: "core",
    prerequisites: ["go"],
  },
  {
    canonical: "fiber",
    aliases: ["gofiber", "fiber framework"],
    family: "backend",
    tier: "core",
    prerequisites: ["go"],
  },
  {
    canonical: "rust",
    aliases: ["rust", "rustlang"],
    family: "backend",
    tier: "advanced",
  },
  {
    canonical: "actix",
    aliases: ["actix", "actix-web"],
    family: "backend",
    tier: "advanced",
    prerequisites: ["rust"],
  },
  {
    canonical: "tokio",
    aliases: ["tokio"],
    family: "backend",
    tier: "advanced",
    prerequisites: ["rust"],
  },
  {
    canonical: "c++",
    aliases: ["c++", "cpp", "modern c++", "c++17", "c++20"],
    family: "backend",
    tier: "core",
  },
  {
    canonical: "c",
    aliases: ["c programming", "ansi c"],
    family: "backend",
    tier: "foundational",
  },
  {
    canonical: "c#",
    aliases: ["c#", "csharp", "c sharp"],
    family: "backend",
    tier: "core",
  },
  {
    canonical: ".net",
    aliases: [".net", "dotnet", "asp.net", "asp.net core", ".net core"],
    family: "backend",
    tier: "core",
    prerequisites: ["c#"],
  },
  {
    canonical: "entity framework",
    aliases: ["entity framework", "ef core"],
    family: "backend",
    tier: "core",
    prerequisites: ["c#", ".net", "sql"],
  },
  {
    canonical: "ruby",
    aliases: ["ruby"],
    family: "backend",
    tier: "foundational",
  },
  {
    canonical: "ruby on rails",
    aliases: ["ruby on rails", "rails", "ror"],
    family: "backend",
    tier: "core",
    prerequisites: ["ruby", "sql"],
  },
  {
    canonical: "php",
    aliases: ["php", "php 8"],
    family: "backend",
    tier: "foundational",
  },
  {
    canonical: "laravel",
    aliases: ["laravel"],
    family: "backend",
    tier: "core",
    prerequisites: ["php", "sql"],
  },
  {
    canonical: "symfony",
    aliases: ["symfony"],
    family: "backend",
    tier: "core",
    prerequisites: ["php"],
  },
  {
    canonical: "scala",
    aliases: ["scala"],
    family: "backend",
    tier: "core",
    prerequisites: ["java"],
  },
  {
    canonical: "akka",
    aliases: ["akka"],
    family: "backend",
    tier: "advanced",
    prerequisites: ["scala"],
  },
  {
    canonical: "elixir",
    aliases: ["elixir", "erlang"],
    family: "backend",
    tier: "core",
  },
  {
    canonical: "phoenix",
    aliases: ["phoenix framework"],
    family: "backend",
    tier: "core",
    prerequisites: ["elixir"],
  },
  {
    canonical: "rest api",
    aliases: ["rest api", "rest apis", "restful api", "restful apis", "rest"],
    family: "backend",
    tier: "foundational",
  },
  {
    canonical: "graphql",
    aliases: ["graphql", "graphql api"],
    family: "backend",
    tier: "core",
    prerequisites: ["rest api"],
  },
  {
    canonical: "grpc",
    aliases: ["grpc", "protobuf", "protocol buffers"],
    family: "backend",
    tier: "advanced",
    prerequisites: ["rest api"],
  },
  {
    canonical: "trpc",
    aliases: ["trpc"],
    family: "backend",
    tier: "core",
    prerequisites: ["typescript", "node.js"],
  },
  {
    canonical: "websocket",
    aliases: ["websocket", "websockets", "socket.io", "ws"],
    family: "backend",
    tier: "core",
    prerequisites: ["rest api"],
  },
  {
    canonical: "webrtc",
    aliases: ["webrtc"],
    family: "backend",
    tier: "advanced",
    prerequisites: ["websocket"],
  },
  {
    canonical: "microservices",
    aliases: ["microservices", "microservice", "microservice architecture"],
    family: "backend",
    tier: "advanced",
    prerequisites: ["rest api", "docker", "distributed systems"],
  },
  {
    canonical: "distributed systems",
    aliases: ["distributed systems", "distributed system", "consensus", "raft"],
    family: "backend",
    tier: "advanced",
    prerequisites: ["system design"],
  },
  {
    canonical: "event-driven architecture",
    aliases: [
      "event-driven",
      "event driven architecture",
      "eda",
      "cqrs",
      "event sourcing",
    ],
    family: "backend",
    tier: "advanced",
    prerequisites: ["microservices"],
  },
  {
    canonical: "system design",
    aliases: [
      "system design",
      "high level design",
      "hld",
      "low level design",
      "lld",
    ],
    family: "backend",
    tier: "advanced",
  },
  {
    canonical: "data structures",
    aliases: ["data structures", "data structure", "dsa"],
    family: "backend",
    tier: "foundational",
  },
  {
    canonical: "algorithms",
    aliases: ["algorithms", "algorithm", "algorithmic complexity"],
    family: "backend",
    tier: "foundational",
  },
  {
    canonical: "object-oriented programming",
    aliases: ["object-oriented programming", "oop", "oops", "solid principles"],
    family: "backend",
    tier: "foundational",
  },
  {
    canonical: "functional programming",
    aliases: ["functional programming", "fp"],
    family: "backend",
    tier: "core",
  },
  {
    canonical: "concurrency",
    aliases: ["concurrency", "multithreading", "async/await", "parallelism"],
    family: "backend",
    tier: "advanced",
  },
  {
    canonical: "caching",
    aliases: [
      "caching",
      "distributed caching",
      "cdn caching",
      "cache invalidation",
    ],
    family: "backend",
    tier: "core",
    prerequisites: ["redis"],
  },
  {
    canonical: "rate limiting",
    aliases: ["rate limiting", "throttling", "token bucket"],
    family: "backend",
    tier: "core",
    prerequisites: ["rest api", "redis"],
  },
  {
    canonical: "api gateway",
    aliases: ["api gateway", "kong", "envoy", "traefik"],
    family: "backend",
    tier: "advanced",
    prerequisites: ["rest api", "microservices"],
  },
  {
    canonical: "message queues",
    aliases: ["message queue", "message queues", "pub/sub", "pubsub"],
    family: "backend",
    tier: "core",
  },
  {
    canonical: "rabbitmq",
    aliases: ["rabbitmq", "rabbit mq", "amqp"],
    family: "backend",
    tier: "core",
    prerequisites: ["message queues"],
  },
  {
    canonical: "celery",
    aliases: ["celery"],
    family: "backend",
    tier: "core",
    prerequisites: ["python", "redis"],
  },
  {
    canonical: "bullmq",
    aliases: ["bullmq", "bull queue"],
    family: "backend",
    tier: "core",
    prerequisites: ["node.js", "redis"],
  },
  {
    canonical: "temporal",
    aliases: ["temporal", "temporal.io", "workflow orchestration"],
    family: "backend",
    tier: "advanced",
    prerequisites: ["distributed systems"],
  },
  {
    canonical: "prisma",
    aliases: ["prisma", "prisma orm"],
    family: "backend",
    tier: "core",
    prerequisites: ["typescript", "sql"],
  },
  {
    canonical: "typeorm",
    aliases: ["typeorm"],
    family: "backend",
    tier: "core",
    prerequisites: ["typescript", "sql"],
  },
  {
    canonical: "sequelize",
    aliases: ["sequelize"],
    family: "backend",
    tier: "core",
    prerequisites: ["node.js", "sql"],
  },
  {
    canonical: "drizzle",
    aliases: ["drizzle", "drizzle orm"],
    family: "backend",
    tier: "core",
    prerequisites: ["typescript", "sql"],
  },
  {
    canonical: "sqlalchemy",
    aliases: ["sqlalchemy", "alembic"],
    family: "backend",
    tier: "core",
    prerequisites: ["python", "sql"],
  },
  {
    canonical: "agile",
    aliases: ["agile", "scrum", "kanban"],
    family: "backend",
    tier: "foundational",
  },

  // =========================================================================
  // 3. CLOUD INFRASTRUCTURE (38 skills)
  // =========================================================================
  {
    canonical: "aws",
    aliases: ["aws", "amazon web services"],
    family: "cloud",
    tier: "core",
  },
  {
    canonical: "aws ec2",
    aliases: ["ec2", "aws ec2"],
    family: "cloud",
    tier: "core",
    prerequisites: ["aws", "linux"],
  },
  {
    canonical: "aws s3",
    aliases: ["s3", "aws s3", "object storage"],
    family: "cloud",
    tier: "foundational",
    prerequisites: ["aws"],
  },
  {
    canonical: "aws lambda",
    aliases: ["aws lambda", "lambda", "serverless"],
    family: "cloud",
    tier: "core",
    prerequisites: ["aws"],
  },
  {
    canonical: "aws rds",
    aliases: ["rds", "aws rds", "aurora"],
    family: "cloud",
    tier: "core",
    prerequisites: ["aws", "sql"],
  },
  {
    canonical: "aws eks",
    aliases: ["eks", "aws eks"],
    family: "cloud",
    tier: "advanced",
    prerequisites: ["aws", "kubernetes"],
  },
  {
    canonical: "aws ecs",
    aliases: ["ecs", "aws ecs", "fargate"],
    family: "cloud",
    tier: "core",
    prerequisites: ["aws", "docker"],
  },
  {
    canonical: "aws sqs",
    aliases: ["sqs", "sns", "aws sqs", "aws sns"],
    family: "cloud",
    tier: "core",
    prerequisites: ["aws", "message queues"],
  },
  {
    canonical: "aws cloudformation",
    aliases: ["cloudformation", "aws cdk", "cdk"],
    family: "cloud",
    tier: "advanced",
    prerequisites: ["aws"],
  },
  {
    canonical: "aws vpc",
    aliases: ["vpc", "aws vpc", "cloud networking"],
    family: "cloud",
    tier: "core",
    prerequisites: ["aws", "networking"],
  },
  {
    canonical: "azure",
    aliases: ["azure", "microsoft azure"],
    family: "cloud",
    tier: "core",
  },
  {
    canonical: "azure aks",
    aliases: ["aks", "azure kubernetes service"],
    family: "cloud",
    tier: "advanced",
    prerequisites: ["azure", "kubernetes"],
  },
  {
    canonical: "azure functions",
    aliases: ["azure functions"],
    family: "cloud",
    tier: "core",
    prerequisites: ["azure"],
  },
  {
    canonical: "azure devops",
    aliases: ["azure devops", "ado"],
    family: "cloud",
    tier: "core",
    prerequisites: ["azure", "ci/cd"],
  },
  {
    canonical: "gcp",
    aliases: ["gcp", "google cloud", "google cloud platform"],
    family: "cloud",
    tier: "core",
  },
  {
    canonical: "gke",
    aliases: ["gke", "google kubernetes engine"],
    family: "cloud",
    tier: "advanced",
    prerequisites: ["gcp", "kubernetes"],
  },
  {
    canonical: "cloud run",
    aliases: ["cloud run", "google cloud run"],
    family: "cloud",
    tier: "core",
    prerequisites: ["gcp", "docker"],
  },
  {
    canonical: "pub/sub gcp",
    aliases: ["google pub/sub", "gcp pub/sub"],
    family: "cloud",
    tier: "core",
    prerequisites: ["gcp"],
  },
  {
    canonical: "cloudflare",
    aliases: ["cloudflare", "cloudflare workers", "cloudflare pages"],
    family: "cloud",
    tier: "core",
  },
  {
    canonical: "vercel",
    aliases: ["vercel"],
    family: "cloud",
    tier: "foundational",
  },
  {
    canonical: "netlify",
    aliases: ["netlify"],
    family: "cloud",
    tier: "foundational",
  },
  {
    canonical: "heroku",
    aliases: ["heroku"],
    family: "cloud",
    tier: "foundational",
  },
  {
    canonical: "digitalocean",
    aliases: ["digitalocean", "digital ocean"],
    family: "cloud",
    tier: "foundational",
  },
  {
    canonical: "firebase",
    aliases: ["firebase", "firestore", "firebase auth"],
    family: "cloud",
    tier: "core",
  },
  {
    canonical: "supabase",
    aliases: ["supabase"],
    family: "cloud",
    tier: "core",
    prerequisites: ["postgresql"],
  },
  {
    canonical: "cdn",
    aliases: ["cdn", "cloudfront", "fastly", "akamai", "edge computing"],
    family: "cloud",
    tier: "core",
  },
  {
    canonical: "dns",
    aliases: ["dns", "route 53", "route53"],
    family: "cloud",
    tier: "foundational",
  },
  {
    canonical: "load balancing",
    aliases: ["load balancing", "load balancer", "alb", "nlb"],
    family: "cloud",
    tier: "core",
    prerequisites: ["networking"],
  },
  {
    canonical: "networking",
    aliases: ["networking", "tcp/ip", "http/2", "http/3", "tls", "ssl"],
    family: "cloud",
    tier: "foundational",
  },
  {
    canonical: "service mesh",
    aliases: ["service mesh", "istio", "linkerd"],
    family: "cloud",
    tier: "advanced",
    prerequisites: ["kubernetes", "networking"],
  },
  {
    canonical: "multi-cloud",
    aliases: ["multi-cloud", "hybrid cloud", "cloud architecture"],
    family: "cloud",
    tier: "advanced",
    prerequisites: ["aws"],
  },
  {
    canonical: "finops",
    aliases: ["finops", "cloud cost optimization"],
    family: "cloud",
    tier: "advanced",
    prerequisites: ["aws"],
  },
  {
    canonical: "api management",
    aliases: ["apigee", "aws api gateway", "azure api management"],
    family: "cloud",
    tier: "core",
    prerequisites: ["rest api"],
  },
  {
    canonical: "cloud storage",
    aliases: ["blob storage", "gcs", "google cloud storage"],
    family: "cloud",
    tier: "foundational",
  },
  {
    canonical: "disaster recovery",
    aliases: [
      "disaster recovery",
      "high availability",
      "failover",
      "multi-region",
    ],
    family: "cloud",
    tier: "advanced",
    prerequisites: ["distributed systems"],
  },
  {
    canonical: "edge functions",
    aliases: ["edge functions", "lambda@edge"],
    family: "cloud",
    tier: "core",
    prerequisites: ["javascript"],
  },
  {
    canonical: "openstack",
    aliases: ["openstack"],
    family: "cloud",
    tier: "advanced",
    prerequisites: ["linux", "networking"],
  },
  {
    canonical: "pulumi",
    aliases: ["pulumi"],
    family: "cloud",
    tier: "advanced",
    prerequisites: ["terraform", "typescript"],
  },

  // =========================================================================
  // 4. DATA ENGINEERING & STORAGE (46 skills)
  // =========================================================================
  {
    canonical: "sql",
    aliases: ["sql", "t-sql", "ansi sql"],
    family: "data",
    tier: "foundational",
  },
  {
    canonical: "postgresql",
    aliases: ["postgresql", "postgres", "postgre sql", "pgvector"],
    family: "data",
    tier: "core",
    prerequisites: ["sql"],
  },
  {
    canonical: "mysql",
    aliases: ["mysql", "mariadb"],
    family: "data",
    tier: "core",
    prerequisites: ["sql"],
  },
  {
    canonical: "sqlite",
    aliases: ["sqlite", "sqlite3"],
    family: "data",
    tier: "foundational",
    prerequisites: ["sql"],
  },
  {
    canonical: "oracle",
    aliases: ["oracle db", "pl/sql", "oracle database"],
    family: "data",
    tier: "core",
    prerequisites: ["sql"],
  },
  {
    canonical: "sql server",
    aliases: ["sql server", "mssql", "microsoft sql server"],
    family: "data",
    tier: "core",
    prerequisites: ["sql"],
  },
  {
    canonical: "mongodb",
    aliases: ["mongodb", "mongo", "mongoose"],
    family: "data",
    tier: "core",
  },
  {
    canonical: "redis",
    aliases: ["redis", "redis cluster", "valkey"],
    family: "data",
    tier: "core",
  },
  {
    canonical: "dynamodb",
    aliases: ["dynamodb", "aws dynamodb"],
    family: "data",
    tier: "core",
    prerequisites: ["aws"],
  },
  {
    canonical: "cassandra",
    aliases: ["cassandra", "apache cassandra", "scylladb"],
    family: "data",
    tier: "advanced",
    prerequisites: ["distributed systems"],
  },
  {
    canonical: "elasticsearch",
    aliases: ["elasticsearch", "elastic search", "opensearch", "elk"],
    family: "data",
    tier: "core",
  },
  {
    canonical: "neo4j",
    aliases: ["neo4j", "graph database", "cypher"],
    family: "data",
    tier: "advanced",
  },
  {
    canonical: "cockroachdb",
    aliases: ["cockroachdb", "cockroach db"],
    family: "data",
    tier: "advanced",
    prerequisites: ["postgresql", "distributed systems"],
  },
  {
    canonical: "timescaledb",
    aliases: ["timescaledb", "influxdb", "time-series database"],
    family: "data",
    tier: "advanced",
    prerequisites: ["postgresql"],
  },
  {
    canonical: "clickhouse",
    aliases: ["clickhouse"],
    family: "data",
    tier: "advanced",
    prerequisites: ["sql"],
  },
  {
    canonical: "duckdb",
    aliases: ["duckdb"],
    family: "data",
    tier: "core",
    prerequisites: ["sql"],
  },
  {
    canonical: "kafka",
    aliases: ["kafka", "apache kafka", "confluent", "kafka streams"],
    family: "data",
    tier: "advanced",
    prerequisites: ["distributed systems"],
  },
  {
    canonical: "apache flink",
    aliases: ["flink", "apache flink", "stream processing"],
    family: "data",
    tier: "advanced",
    prerequisites: ["kafka", "java"],
  },
  {
    canonical: "spark",
    aliases: ["spark", "apache spark", "pyspark"],
    family: "data",
    tier: "advanced",
    prerequisites: ["python", "sql"],
  },
  {
    canonical: "hadoop",
    aliases: ["hadoop", "hdfs", "mapreduce", "hive"],
    family: "data",
    tier: "core",
    prerequisites: ["sql"],
  },
  {
    canonical: "airflow",
    aliases: ["airflow", "apache airflow"],
    family: "data",
    tier: "core",
    prerequisites: ["python", "sql"],
  },
  {
    canonical: "dagster",
    aliases: ["dagster"],
    family: "data",
    tier: "core",
    prerequisites: ["python"],
  },
  {
    canonical: "prefect",
    aliases: ["prefect"],
    family: "data",
    tier: "core",
    prerequisites: ["python"],
  },
  {
    canonical: "dbt",
    aliases: ["dbt", "data build tool"],
    family: "data",
    tier: "core",
    prerequisites: ["sql"],
  },
  {
    canonical: "snowflake",
    aliases: ["snowflake", "snowflake db"],
    family: "data",
    tier: "core",
    prerequisites: ["sql"],
  },
  {
    canonical: "bigquery",
    aliases: ["bigquery", "google bigquery"],
    family: "data",
    tier: "core",
    prerequisites: ["sql", "gcp"],
  },
  {
    canonical: "redshift",
    aliases: ["redshift", "aws redshift"],
    family: "data",
    tier: "core",
    prerequisites: ["sql", "aws"],
  },
  {
    canonical: "databricks",
    aliases: ["databricks", "delta lake"],
    family: "data",
    tier: "advanced",
    prerequisites: ["spark", "sql"],
  },
  {
    canonical: "apache iceberg",
    aliases: ["iceberg", "apache iceberg", "lakehouse"],
    family: "data",
    tier: "advanced",
    prerequisites: ["spark", "sql"],
  },
  {
    canonical: "etl",
    aliases: [
      "etl",
      "elt",
      "data pipelines",
      "data pipeline",
      "data ingestion",
    ],
    family: "data",
    tier: "core",
    prerequisites: ["sql", "python"],
  },
  {
    canonical: "data warehousing",
    aliases: [
      "data warehouse",
      "data warehousing",
      "olap",
      "dimensional modeling",
    ],
    family: "data",
    tier: "core",
    prerequisites: ["sql"],
  },
  {
    canonical: "data modeling",
    aliases: ["data modeling", "schema design", "er diagram", "normalization"],
    family: "data",
    tier: "core",
    prerequisites: ["sql"],
  },
  {
    canonical: "database indexing",
    aliases: [
      "database indexing",
      "query optimization",
      "explain analyze",
      "b-tree",
    ],
    family: "data",
    tier: "advanced",
    prerequisites: ["sql", "postgresql"],
  },
  {
    canonical: "database sharding",
    aliases: ["sharding", "partitioning", "read replicas", "replication"],
    family: "data",
    tier: "advanced",
    prerequisites: ["sql", "distributed systems"],
  },
  {
    canonical: "cdc",
    aliases: ["cdc", "change data capture", "debezium"],
    family: "data",
    tier: "advanced",
    prerequisites: ["kafka", "postgresql"],
  },
  {
    canonical: "pandas",
    aliases: ["pandas"],
    family: "data",
    tier: "foundational",
    prerequisites: ["python"],
  },
  {
    canonical: "numpy",
    aliases: ["numpy"],
    family: "data",
    tier: "foundational",
    prerequisites: ["python"],
  },
  {
    canonical: "polars",
    aliases: ["polars"],
    family: "data",
    tier: "core",
    prerequisites: ["python"],
  },
  {
    canonical: "vector database",
    aliases: [
      "vector database",
      "vector db",
      "pinecone",
      "weaviate",
      "qdrant",
      "milvus",
      "chromadb",
    ],
    family: "data",
    tier: "core",
  },
  {
    canonical: "data governance",
    aliases: ["data governance", "data lineage", "data catalog"],
    family: "data",
    tier: "advanced",
    prerequisites: ["data warehousing"],
  },
  {
    canonical: "great expectations",
    aliases: ["great expectations", "data quality"],
    family: "data",
    tier: "core",
    prerequisites: ["python", "sql"],
  },
  {
    canonical: "apache beam",
    aliases: ["apache beam", "dataflow"],
    family: "data",
    tier: "advanced",
    prerequisites: ["python", "gcp"],
  },
  {
    canonical: "fivetran",
    aliases: ["fivetran", "airbyte"],
    family: "data",
    tier: "core",
    prerequisites: ["etl"],
  },
  {
    canonical: "tableau",
    aliases: ["tableau"],
    family: "data",
    tier: "foundational",
    prerequisites: ["sql"],
  },
  {
    canonical: "power bi",
    aliases: ["power bi", "powerbi"],
    family: "data",
    tier: "foundational",
    prerequisites: ["sql"],
  },
  {
    canonical: "looker",
    aliases: ["looker", "lookml"],
    family: "data",
    tier: "core",
    prerequisites: ["sql"],
  },

  // =========================================================================
  // 5. DEVOPS, CI/CD & SRE (38 skills)
  // =========================================================================
  {
    canonical: "git",
    aliases: ["git", "version control"],
    family: "devops",
    tier: "foundational",
  },
  {
    canonical: "github",
    aliases: ["github"],
    family: "devops",
    tier: "foundational",
    prerequisites: ["git"],
  },
  {
    canonical: "gitlab",
    aliases: ["gitlab"],
    family: "devops",
    tier: "foundational",
    prerequisites: ["git"],
  },
  {
    canonical: "linux",
    aliases: ["linux", "unix", "ubuntu", "rhel", "centos"],
    family: "devops",
    tier: "foundational",
  },
  {
    canonical: "bash",
    aliases: ["bash", "shell scripting", "zsh", "sh"],
    family: "devops",
    tier: "foundational",
    prerequisites: ["linux"],
  },
  {
    canonical: "docker",
    aliases: ["docker", "dockerfile", "docker compose", "containers"],
    family: "devops",
    tier: "core",
    prerequisites: ["linux"],
  },
  {
    canonical: "kubernetes",
    aliases: ["kubernetes", "k8s", "kubectl"],
    family: "devops",
    tier: "advanced",
    prerequisites: ["docker", "linux", "networking"],
  },
  {
    canonical: "helm",
    aliases: ["helm", "helm charts"],
    family: "devops",
    tier: "advanced",
    prerequisites: ["kubernetes", "docker"],
  },
  {
    canonical: "argocd",
    aliases: ["argocd", "argo cd", "gitops", "fluxcd"],
    family: "devops",
    tier: "advanced",
    prerequisites: ["kubernetes", "git"],
  },
  {
    canonical: "terraform",
    aliases: ["terraform", "hcl", "iac", "infrastructure as code"],
    family: "devops",
    tier: "core",
    prerequisites: ["aws"],
  },
  {
    canonical: "ansible",
    aliases: ["ansible", "configuration management"],
    family: "devops",
    tier: "core",
    prerequisites: ["linux"],
  },
  {
    canonical: "packer",
    aliases: ["packer"],
    family: "devops",
    tier: "core",
    prerequisites: ["linux", "aws"],
  },
  {
    canonical: "ci/cd",
    aliases: [
      "ci/cd",
      "ci cd",
      "continuous integration",
      "continuous delivery",
      "continuous deployment",
    ],
    family: "devops",
    tier: "core",
    prerequisites: ["git"],
  },
  {
    canonical: "github actions",
    aliases: ["github actions", "gh actions"],
    family: "devops",
    tier: "core",
    prerequisites: ["github", "ci/cd"],
  },
  {
    canonical: "gitlab ci",
    aliases: ["gitlab ci", "gitlab ci/cd"],
    family: "devops",
    tier: "core",
    prerequisites: ["gitlab", "ci/cd"],
  },
  {
    canonical: "jenkins",
    aliases: ["jenkins", "jenkinsfile"],
    family: "devops",
    tier: "core",
    prerequisites: ["ci/cd"],
  },
  {
    canonical: "circleci",
    aliases: ["circleci", "circle ci"],
    family: "devops",
    tier: "core",
    prerequisites: ["ci/cd"],
  },
  {
    canonical: "nginx",
    aliases: ["nginx", "reverse proxy"],
    family: "devops",
    tier: "core",
    prerequisites: ["linux", "networking"],
  },
  {
    canonical: "apache",
    aliases: ["apache http", "apache web server"],
    family: "devops",
    tier: "foundational",
    prerequisites: ["linux"],
  },
  {
    canonical: "caddy",
    aliases: ["caddy"],
    family: "devops",
    tier: "core",
    prerequisites: ["linux"],
  },
  {
    canonical: "prometheus",
    aliases: ["prometheus", "promql"],
    family: "devops",
    tier: "core",
    prerequisites: ["docker"],
  },
  {
    canonical: "grafana",
    aliases: ["grafana"],
    family: "devops",
    tier: "core",
    prerequisites: ["prometheus"],
  },
  {
    canonical: "datadog",
    aliases: ["datadog", "apm"],
    family: "devops",
    tier: "core",
  },
  {
    canonical: "new relic",
    aliases: ["new relic", "newrelic"],
    family: "devops",
    tier: "core",
  },
  {
    canonical: "sentry",
    aliases: ["sentry", "error tracking"],
    family: "devops",
    tier: "foundational",
  },
  {
    canonical: "opentelemetry",
    aliases: ["opentelemetry", "otel", "distributed tracing", "jaeger"],
    family: "devops",
    tier: "advanced",
    prerequisites: ["microservices"],
  },
  {
    canonical: "observability",
    aliases: ["observability", "logging", "monitoring", "alerting"],
    family: "devops",
    tier: "core",
  },
  {
    canonical: "sre",
    aliases: ["sre", "site reliability engineering", "slo", "sla", "sli"],
    family: "devops",
    tier: "advanced",
    prerequisites: ["linux", "observability"],
  },
  {
    canonical: "incident management",
    aliases: [
      "incident management",
      "incident response",
      "postmortem",
      "on-call",
    ],
    family: "devops",
    tier: "core",
    prerequisites: ["observability"],
  },
  {
    canonical: "chaos engineering",
    aliases: ["chaos engineering", "fault injection"],
    family: "devops",
    tier: "advanced",
    prerequisites: ["distributed systems", "kubernetes"],
  },
  {
    canonical: "container registry",
    aliases: ["ecr", "docker hub", "ghcr", "artifact registry"],
    family: "devops",
    tier: "foundational",
    prerequisites: ["docker"],
  },
  {
    canonical: "podman",
    aliases: ["podman"],
    family: "devops",
    tier: "core",
    prerequisites: ["linux"],
  },
  {
    canonical: "vagrant",
    aliases: ["vagrant"],
    family: "devops",
    tier: "foundational",
    prerequisites: ["linux"],
  },
  {
    canonical: "consul",
    aliases: ["consul", "service discovery"],
    family: "devops",
    tier: "advanced",
    prerequisites: ["microservices"],
  },
  {
    canonical: "vault",
    aliases: ["hashicorp vault", "secrets management"],
    family: "devops",
    tier: "advanced",
    prerequisites: ["linux"],
  },
  {
    canonical: "splunk",
    aliases: ["splunk"],
    family: "devops",
    tier: "core",
    prerequisites: ["observability"],
  },
  {
    canonical: "pagerduty",
    aliases: ["pagerduty", "opsgenie"],
    family: "devops",
    tier: "foundational",
  },
  {
    canonical: "systemd",
    aliases: ["systemd", "cron"],
    family: "devops",
    tier: "foundational",
    prerequisites: ["linux"],
  },

  // =========================================================================
  // 6. MOBILE DEVELOPMENT (24 skills)
  // =========================================================================
  {
    canonical: "react native",
    aliases: ["react native", "react-native"],
    family: "mobile",
    tier: "core",
    prerequisites: ["react", "javascript"],
  },
  {
    canonical: "expo",
    aliases: ["expo", "expo router"],
    family: "mobile",
    tier: "core",
    prerequisites: ["react native"],
  },
  {
    canonical: "flutter",
    aliases: ["flutter"],
    family: "mobile",
    tier: "core",
    prerequisites: ["dart"],
  },
  {
    canonical: "dart",
    aliases: ["dart"],
    family: "mobile",
    tier: "foundational",
  },
  {
    canonical: "swift",
    aliases: ["swift", "swift 5"],
    family: "mobile",
    tier: "core",
  },
  {
    canonical: "swiftui",
    aliases: ["swiftui", "swift ui"],
    family: "mobile",
    tier: "core",
    prerequisites: ["swift"],
  },
  {
    canonical: "uikit",
    aliases: ["uikit"],
    family: "mobile",
    tier: "core",
    prerequisites: ["swift"],
  },
  {
    canonical: "objective-c",
    aliases: ["objective-c", "objc"],
    family: "mobile",
    tier: "core",
  },
  {
    canonical: "ios",
    aliases: [
      "ios",
      "ios development",
      "xcode",
      "cocoapods",
      "swift package manager",
    ],
    family: "mobile",
    tier: "core",
    prerequisites: ["swift"],
  },
  {
    canonical: "kotlin",
    aliases: ["kotlin", "kotlin multiplatform", "kmp"],
    family: "mobile",
    tier: "core",
    prerequisites: ["java"],
  },
  {
    canonical: "jetpack compose",
    aliases: ["jetpack compose", "compose"],
    family: "mobile",
    tier: "core",
    prerequisites: ["kotlin"],
  },
  {
    canonical: "android",
    aliases: ["android", "android sdk", "android studio", "gradle"],
    family: "mobile",
    tier: "core",
    prerequisites: ["kotlin"],
  },
  {
    canonical: "coroutines",
    aliases: ["kotlin coroutines", "coroutines", "flow"],
    family: "mobile",
    tier: "advanced",
    prerequisites: ["kotlin"],
  },
  {
    canonical: "room database",
    aliases: ["room", "room database", "realm"],
    family: "mobile",
    tier: "core",
    prerequisites: ["android", "sqlite"],
  },
  {
    canonical: "core data",
    aliases: ["core data", "swiftdata"],
    family: "mobile",
    tier: "core",
    prerequisites: ["ios"],
  },
  {
    canonical: "mvvm",
    aliases: ["mvvm", "mvi", "clean architecture"],
    family: "mobile",
    tier: "core",
  },
  {
    canonical: "push notifications",
    aliases: ["push notifications", "apns", "fcm", "firebase cloud messaging"],
    family: "mobile",
    tier: "core",
    prerequisites: ["firebase"],
  },
  {
    canonical: "offline-first",
    aliases: ["offline-first", "offline sync", "local storage"],
    family: "mobile",
    tier: "advanced",
    prerequisites: ["sqlite"],
  },
  {
    canonical: "app store deployment",
    aliases: [
      "testflight",
      "app store connect",
      "google play console",
      "fastlane",
    ],
    family: "mobile",
    tier: "core",
  },
  {
    canonical: "capacitor",
    aliases: ["capacitor", "ionic"],
    family: "mobile",
    tier: "core",
    prerequisites: ["javascript"],
  },
  {
    canonical: "detox",
    aliases: ["detox"],
    family: "mobile",
    tier: "core",
    prerequisites: ["react native"],
  },
  {
    canonical: "xctest",
    aliases: ["xctest", "xcuitest"],
    family: "mobile",
    tier: "core",
    prerequisites: ["ios"],
  },
  {
    canonical: "espresso",
    aliases: ["espresso testing", "android espresso"],
    family: "mobile",
    tier: "core",
    prerequisites: ["android"],
  },
  {
    canonical: "deep linking",
    aliases: ["deep linking", "universal links", "app links"],
    family: "mobile",
    tier: "core",
  },

  // =========================================================================
  // 7. TESTING & QA AUTOMATION (24 skills)
  // =========================================================================
  {
    canonical: "unit testing",
    aliases: ["unit testing", "unit tests", "tdd", "test-driven development"],
    family: "testing",
    tier: "foundational",
  },
  {
    canonical: "integration testing",
    aliases: ["integration testing", "integration tests", "api testing"],
    family: "testing",
    tier: "core",
    prerequisites: ["unit testing"],
  },
  {
    canonical: "end-to-end testing",
    aliases: ["end-to-end testing", "e2e testing", "e2e", "browser automation"],
    family: "testing",
    tier: "core",
    prerequisites: ["integration testing"],
  },
  {
    canonical: "jest",
    aliases: ["jest"],
    family: "testing",
    tier: "core",
    prerequisites: ["javascript", "unit testing"],
  },
  {
    canonical: "vitest",
    aliases: ["vitest"],
    family: "testing",
    tier: "core",
    prerequisites: ["typescript", "unit testing"],
  },
  {
    canonical: "react testing library",
    aliases: ["react testing library", "testing library", "rtl"],
    family: "testing",
    tier: "core",
    prerequisites: ["react", "jest"],
  },
  {
    canonical: "playwright",
    aliases: ["playwright"],
    family: "testing",
    tier: "core",
    prerequisites: ["end-to-end testing"],
  },
  {
    canonical: "cypress",
    aliases: ["cypress"],
    family: "testing",
    tier: "core",
    prerequisites: ["end-to-end testing"],
  },
  {
    canonical: "selenium",
    aliases: ["selenium", "webdriver"],
    family: "testing",
    tier: "core",
    prerequisites: ["end-to-end testing"],
  },
  {
    canonical: "puppeteer",
    aliases: ["puppeteer"],
    family: "testing",
    tier: "core",
    prerequisites: ["node.js"],
  },
  {
    canonical: "pytest",
    aliases: ["pytest", "unittest"],
    family: "testing",
    tier: "core",
    prerequisites: ["python", "unit testing"],
  },
  {
    canonical: "junit",
    aliases: ["junit", "junit 5", "mockito", "testng"],
    family: "testing",
    tier: "core",
    prerequisites: ["java", "unit testing"],
  },
  {
    canonical: "mocha",
    aliases: ["mocha", "chai", "sinon"],
    family: "testing",
    tier: "core",
    prerequisites: ["node.js"],
  },
  {
    canonical: "supertest",
    aliases: ["supertest"],
    family: "testing",
    tier: "core",
    prerequisites: ["node.js", "integration testing"],
  },
  {
    canonical: "postman",
    aliases: ["postman", "newman", "insomnia"],
    family: "testing",
    tier: "foundational",
    prerequisites: ["rest api"],
  },
  {
    canonical: "k6",
    aliases: ["k6", "grafana k6", "load testing", "performance testing"],
    family: "testing",
    tier: "advanced",
    prerequisites: ["rest api"],
  },
  {
    canonical: "jmeter",
    aliases: ["jmeter", "apache jmeter", "locust"],
    family: "testing",
    tier: "core",
    prerequisites: ["rest api"],
  },
  {
    canonical: "bdd",
    aliases: ["bdd", "behavior-driven development", "cucumber", "gherkin"],
    family: "testing",
    tier: "core",
    prerequisites: ["unit testing"],
  },
  {
    canonical: "contract testing",
    aliases: ["contract testing", "pact", "consumer-driven contracts"],
    family: "testing",
    tier: "advanced",
    prerequisites: ["microservices", "integration testing"],
  },
  {
    canonical: "testcontainers",
    aliases: ["testcontainers"],
    family: "testing",
    tier: "advanced",
    prerequisites: ["docker", "integration testing"],
  },
  {
    canonical: "appium",
    aliases: ["appium"],
    family: "testing",
    tier: "core",
    prerequisites: ["selenium"],
  },
  {
    canonical: "sonarqube",
    aliases: ["sonarqube", "static analysis", "code coverage"],
    family: "testing",
    tier: "core",
    prerequisites: ["ci/cd"],
  },
  {
    canonical: "msw",
    aliases: ["msw", "mock service worker", "api mocking"],
    family: "testing",
    tier: "core",
    prerequisites: ["javascript"],
  },
  {
    canonical: "qa automation",
    aliases: ["qa automation", "test automation", "regression testing"],
    family: "testing",
    tier: "core",
  },

  // =========================================================================
  // 8. SECURITY & IDENTITY (26 skills)
  // =========================================================================
  {
    canonical: "oauth",
    aliases: ["oauth", "oauth2", "oauth 2.0", "oidc", "openid connect"],
    family: "security",
    tier: "core",
    prerequisites: ["rest api"],
  },
  {
    canonical: "jwt",
    aliases: ["jwt", "json web token", "json web tokens", "jwk"],
    family: "security",
    tier: "core",
    prerequisites: ["rest api"],
  },
  {
    canonical: "saml",
    aliases: ["saml", "saml 2.0", "sso", "single sign-on"],
    family: "security",
    tier: "core",
    prerequisites: ["oauth"],
  },
  {
    canonical: "rbac",
    aliases: ["rbac", "abac", "role-based access control", "authorization"],
    family: "security",
    tier: "core",
  },
  {
    canonical: "iam",
    aliases: [
      "iam",
      "aws iam",
      "identity and access management",
      "least privilege",
    ],
    family: "security",
    tier: "core",
    prerequisites: ["aws"],
  },
  {
    canonical: "cybersecurity",
    aliases: ["cybersecurity", "application security", "appsec", "infosec"],
    family: "security",
    tier: "core",
  },
  {
    canonical: "owasp",
    aliases: ["owasp", "owasp top 10"],
    family: "security",
    tier: "core",
    prerequisites: ["cybersecurity"],
  },
  {
    canonical: "xss",
    aliases: ["xss", "cross-site scripting", "csp", "content security policy"],
    family: "security",
    tier: "core",
    prerequisites: ["html", "javascript"],
  },
  {
    canonical: "csrf",
    aliases: ["csrf", "cross-site request forgery", "cors"],
    family: "security",
    tier: "core",
    prerequisites: ["rest api"],
  },
  {
    canonical: "sql injection",
    aliases: ["sql injection", "sqli", "parameterized queries"],
    family: "security",
    tier: "core",
    prerequisites: ["sql"],
  },
  {
    canonical: "ssrf",
    aliases: ["ssrf", "server-side request forgery"],
    family: "security",
    tier: "advanced",
    prerequisites: ["rest api", "networking"],
  },
  {
    canonical: "cryptography",
    aliases: [
      "cryptography",
      "encryption",
      "aes",
      "rsa",
      "hashing",
      "bcrypt",
      "argon2",
    ],
    family: "security",
    tier: "core",
  },
  {
    canonical: "pki",
    aliases: ["pki", "mtls", "mutual tls", "x.509", "certificates"],
    family: "security",
    tier: "advanced",
    prerequisites: ["networking", "cryptography"],
  },
  {
    canonical: "kms",
    aliases: ["kms", "aws kms", "key management"],
    family: "security",
    tier: "core",
    prerequisites: ["aws", "cryptography"],
  },
  {
    canonical: "penetration testing",
    aliases: [
      "penetration testing",
      "pentesting",
      "burp suite",
      "vulnerability assessment",
    ],
    family: "security",
    tier: "advanced",
    prerequisites: ["owasp", "networking"],
  },
  {
    canonical: "devsecops",
    aliases: ["devsecops", "sast", "dast", "sca", "snyk", "trivy"],
    family: "security",
    tier: "advanced",
    prerequisites: ["ci/cd", "docker"],
  },
  {
    canonical: "waf",
    aliases: ["waf", "web application firewall", "ddos protection"],
    family: "security",
    tier: "core",
    prerequisites: ["networking"],
  },
  {
    canonical: "zero trust",
    aliases: ["zero trust", "zero-trust architecture"],
    family: "security",
    tier: "advanced",
    prerequisites: ["iam", "networking"],
  },
  {
    canonical: "soc 2",
    aliases: ["soc 2", "soc2", "iso 27001", "gdpr", "hipaa", "pci-dss"],
    family: "security",
    tier: "core",
  },
  {
    canonical: "auth0",
    aliases: ["auth0", "okta", "clerk", "keycloak", "cognito"],
    family: "security",
    tier: "core",
    prerequisites: ["oauth"],
  },
  {
    canonical: "threat modeling",
    aliases: ["threat modeling", "stride"],
    family: "security",
    tier: "advanced",
    prerequisites: ["system design", "owasp"],
  },
  {
    canonical: "siem",
    aliases: ["siem", "audit logging", "security monitoring"],
    family: "security",
    tier: "advanced",
    prerequisites: ["observability"],
  },
  {
    canonical: "container security",
    aliases: ["container security", "kubernetes security", "pod security"],
    family: "security",
    tier: "advanced",
    prerequisites: ["docker", "kubernetes"],
  },
  {
    canonical: "api security",
    aliases: ["api security", "api authentication", "hmac"],
    family: "security",
    tier: "core",
    prerequisites: ["rest api", "jwt"],
  },
  {
    canonical: "sbom",
    aliases: ["sbom", "supply chain security", "dependency scanning"],
    family: "security",
    tier: "core",
    prerequisites: ["ci/cd"],
  },
  {
    canonical: "network security",
    aliases: ["network security", "firewall", "vpn", "ids/ips"],
    family: "security",
    tier: "core",
    prerequisites: ["networking"],
  },

  // =========================================================================
  // 9. AI, ML & LLM SYSTEMS (40 skills)
  // =========================================================================
  {
    canonical: "machine learning",
    aliases: [
      "machine learning",
      "ml",
      "supervised learning",
      "unsupervised learning",
    ],
    family: "ai_ml",
    tier: "foundational",
    prerequisites: ["python"],
  },
  {
    canonical: "deep learning",
    aliases: ["deep learning", "neural networks", "cnn", "rnn", "transformers"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["machine learning", "python"],
  },
  {
    canonical: "nlp",
    aliases: [
      "nlp",
      "natural language processing",
      "text classification",
      "ner",
    ],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["python", "machine learning"],
  },
  {
    canonical: "computer vision",
    aliases: ["computer vision", "opencv", "object detection", "yolo"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["python", "deep learning"],
  },
  {
    canonical: "llm",
    aliases: [
      "llm",
      "llms",
      "large language models",
      "large language model",
      "generative ai",
      "genai",
    ],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["python"],
  },
  {
    canonical: "rag",
    aliases: [
      "rag",
      "retrieval augmented generation",
      "retrieval-augmented generation",
    ],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["llm", "vector database", "embeddings"],
  },
  {
    canonical: "prompt engineering",
    aliases: [
      "prompt engineering",
      "few-shot",
      "chain of thought",
      "structured outputs",
    ],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["llm"],
  },
  {
    canonical: "ai agents",
    aliases: [
      "ai agents",
      "agentic workflows",
      "tool calling",
      "function calling",
      "mcp",
    ],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["llm", "python"],
  },
  {
    canonical: "langchain",
    aliases: ["langchain", "langgraph", "langsmith"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["llm", "python"],
  },
  {
    canonical: "llamaindex",
    aliases: ["llamaindex", "llama index"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["llm", "rag"],
  },
  {
    canonical: "embeddings",
    aliases: [
      "embeddings",
      "vector embeddings",
      "semantic search",
      "reranking",
    ],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["nlp"],
  },
  {
    canonical: "fine-tuning",
    aliases: ["fine-tuning", "lora", "qlora", "peft", "rlhf", "dpo"],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["llm", "pytorch"],
  },
  {
    canonical: "pytorch",
    aliases: ["pytorch", "torch"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["python", "deep learning"],
  },
  {
    canonical: "tensorflow",
    aliases: ["tensorflow", "keras"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["python", "deep learning"],
  },
  {
    canonical: "scikit-learn",
    aliases: ["scikit-learn", "sklearn"],
    family: "ai_ml",
    tier: "foundational",
    prerequisites: ["python", "machine learning"],
  },
  {
    canonical: "xgboost",
    aliases: ["xgboost", "lightgbm", "catboost", "gradient boosting"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["machine learning", "python"],
  },
  {
    canonical: "hugging face",
    aliases: ["hugging face", "huggingface", "transformers library"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["python", "nlp"],
  },
  {
    canonical: "openai api",
    aliases: ["openai api", "gpt-4", "anthropic", "claude api", "gemini api"],
    family: "ai_ml",
    tier: "foundational",
    prerequisites: ["rest api"],
  },
  {
    canonical: "vllm",
    aliases: ["vllm", "tgi", "ollama", "llama.cpp", "llm serving"],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["llm", "docker"],
  },
  {
    canonical: "onnx",
    aliases: ["onnx", "tensorrt", "model quantization"],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["pytorch"],
  },
  {
    canonical: "mlops",
    aliases: ["mlops", "ml ops", "model deployment", "model monitoring"],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["machine learning", "docker", "ci/cd"],
  },
  {
    canonical: "mlflow",
    aliases: ["mlflow", "weights & biases", "wandb"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["machine learning"],
  },
  {
    canonical: "kubeflow",
    aliases: ["kubeflow", "sagemaker", "aws sagemaker", "vertex ai"],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["mlops", "kubernetes"],
  },
  {
    canonical: "ray",
    aliases: ["ray", "ray serve", "distributed training"],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["python", "distributed systems"],
  },
  {
    canonical: "feature engineering",
    aliases: ["feature engineering", "feature store", "feast"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["machine learning", "pandas"],
  },
  {
    canonical: "recommendation systems",
    aliases: [
      "recommendation systems",
      "recommender systems",
      "collaborative filtering",
    ],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["machine learning"],
  },
  {
    canonical: "reinforcement learning",
    aliases: ["reinforcement learning"],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["deep learning"],
  },
  {
    canonical: "time series forecasting",
    aliases: ["time series", "forecasting", "prophet", "arima"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["python", "pandas"],
  },
  {
    canonical: "a/b testing",
    aliases: ["a/b testing", "experimentation", "statistical significance"],
    family: "ai_ml",
    tier: "core",
  },
  {
    canonical: "llm evaluation",
    aliases: ["llm evaluation", "evals", "ragas", "hallucination detection"],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["llm", "rag"],
  },
  {
    canonical: "cuda",
    aliases: ["cuda", "gpu programming", "triton"],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["c++", "pytorch"],
  },
  {
    canonical: "scipy",
    aliases: ["scipy", "statsmodels"],
    family: "ai_ml",
    tier: "foundational",
    prerequisites: ["python", "numpy"],
  },
  {
    canonical: "jupyter",
    aliases: ["jupyter", "jupyter notebook", "colab"],
    family: "ai_ml",
    tier: "foundational",
    prerequisites: ["python"],
  },
  {
    canonical: "speech recognition",
    aliases: ["asr", "speech-to-text", "whisper", "tts", "text-to-speech"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["deep learning"],
  },
  {
    canonical: "knowledge graphs",
    aliases: ["knowledge graphs", "knowledge graph", "ontology"],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["neo4j", "nlp"],
  },
  {
    canonical: "guardrails",
    aliases: ["ai guardrails", "nemo guardrails", "content moderation"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["llm"],
  },
  {
    canonical: "dvc",
    aliases: ["dvc", "data version control"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["git", "machine learning"],
  },
  {
    canonical: "bentoml",
    aliases: ["bentoml", "triton inference server"],
    family: "ai_ml",
    tier: "advanced",
    prerequisites: ["docker", "mlops"],
  },
  {
    canonical: "ocr",
    aliases: ["ocr", "tesseract", "document extraction"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["python"],
  },
  {
    canonical: "semantic chunking",
    aliases: ["chunking", "document parsing", "hybrid search"],
    family: "ai_ml",
    tier: "core",
    prerequisites: ["rag"],
  },
];

// Alias (lowercase) -> canonical name, including each canonical name itself.
export const ALIAS_TO_CANONICAL = new Map<string, string>(
  SKILL_DICTIONARY.flatMap((entry) => [
    [entry.canonical, entry.canonical] as const,
    ...entry.aliases.map(
      (alias) => [alias.toLowerCase(), entry.canonical] as const,
    ),
  ]),
);

export const CANONICAL_SKILL_MAP: ReadonlyMap<string, SkillEntry> = new Map(
  SKILL_DICTIONARY.map((entry) => [entry.canonical, entry]),
);

const escapeRegex = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSearchPatterns = (): Array<{ canonical: string; pattern: RegExp }> =>
  SKILL_DICTIONARY.map((entry) => {
    const names = [...new Set([entry.canonical, ...entry.aliases])].sort(
      (a, b) => b.length - a.length,
    );
    const alternation = names.map(escapeRegex).join("|");
    return {
      canonical: entry.canonical,
      // Whole-word boundaries that still work for names ending in symbols, such as "c++" or "c#".
      pattern: new RegExp(`(?<![a-z0-9])(?:${alternation})(?![a-z0-9])`, "g"),
    };
  });

let SEARCH_PATTERNS = buildSearchPatterns();

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

// =========================================================================
// SKILL RELATIONSHIPS (PREREQUISITES) & FAMILY LOOKUPS
// =========================================================================

export const getSkillPrerequisites = (skill: string): string[] => {
  const canonical =
    ALIAS_TO_CANONICAL.get(skill.toLowerCase().trim()) ??
    skill.toLowerCase().trim();
  return CANONICAL_SKILL_MAP.get(canonical)?.prerequisites ?? [];
};

export interface PrerequisiteReadinessAlert {
  targetSkill: string;
  missingPrerequisites: string[];
  satisfiedPrerequisites: string[];
  rationale: string;
}

export const analyzeSkillPrerequisiteReadiness = (
  targetSkills: string[],
  candidateSkills: string[],
): PrerequisiteReadinessAlert[] => {
  const candidateCanonicalSet = new Set(
    candidateSkills.map(
      (s) =>
        ALIAS_TO_CANONICAL.get(s.toLowerCase().trim()) ??
        s.toLowerCase().trim(),
    ),
  );

  const alerts: PrerequisiteReadinessAlert[] = [];

  for (const rawTarget of targetSkills) {
    const canonical =
      ALIAS_TO_CANONICAL.get(rawTarget.toLowerCase().trim()) ??
      rawTarget.toLowerCase().trim();
    const prereqs = CANONICAL_SKILL_MAP.get(canonical)?.prerequisites ?? [];
    if (prereqs.length === 0) continue;

    const missing = prereqs.filter((p) => !candidateCanonicalSet.has(p));
    const satisfied = prereqs.filter((p) => candidateCanonicalSet.has(p));

    if (missing.length > 0) {
      alerts.push({
        targetSkill: canonical,
        missingPrerequisites: missing,
        satisfiedPrerequisites: satisfied,
        rationale: `${canonical} builds on ${prereqs.join(", ")} — missing foundational evidence in ${missing.join(", ")}.`,
      });
    }
  }

  return alerts;
};

// =========================================================================
// UNRECOGNIZED SKILL REVIEW QUEUE & DICTIONARY QUALITY TELEMETRY
// =========================================================================

export interface UnrecognizedSkillRecord {
  token: string;
  occurrences: number;
  sources: string[];
  sampleContexts: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  status: "PENDING" | "APPROVED_CANONICAL" | "MAPPED_ALIAS" | "DISMISSED";
  resolvedTo?: string;
}

const unrecognizedReviewQueue = new Map<string, UnrecognizedSkillRecord>();

// Non-skill noise words that should never pollute the review queue
const NOISE_STOPWORDS = new Set([
  "and",
  "or",
  "the",
  "with",
  "experience",
  "years",
  "knowledge",
  "strong",
  "good",
  "team",
  "communication",
  "skills",
  "engineering",
  "software",
  "developer",
  "engineer",
  "senior",
  "junior",
  "lead",
  "degree",
  "computer science",
  "bachelor",
  "master",
  "remote",
  "hybrid",
  "full time",
]);

const dismissedTokensCache = new Set<string>();

/**
 * Hydrates approved canonicals, approved aliases, and dismissed tokens from PostgreSQL
 * so ontology decisions survive server restarts and work across instances.
 */
export const hydrateOntologyFromDatabase = async (): Promise<{
  approvedLoaded: number;
  rejectedLoaded: number;
}> => {
  if (!prisma?.ontologyAlias?.findMany) {
    return { approvedLoaded: 0, rejectedLoaded: 0 };
  }

  const rows = await prisma.ontologyAlias.findMany({
    where: { status: { in: ["APPROVED", "REJECTED"] } },
  });

  let approvedLoaded = 0;
  let rejectedLoaded = 0;
  let patternsDirty = false;

  for (const row of rows) {
    const raw = row.rawSkill.toLowerCase().trim();
    const canonical = row.canonicalSkill.toLowerCase().trim();
    if (!raw) continue;

    if (row.status === "REJECTED") {
      dismissedTokensCache.add(raw);
      unrecognizedReviewQueue.delete(raw);
      rejectedLoaded++;
      continue;
    }

    if (row.status === "APPROVED" && canonical) {
      dismissedTokensCache.delete(raw);
      if (raw === canonical) {
        if (!CANONICAL_SKILL_MAP.has(canonical)) {
          const newEntry: SkillEntry = {
            canonical,
            aliases: [canonical],
            family: "backend",
            tier: "core",
          };
          SKILL_DICTIONARY.push(newEntry);
          (CANONICAL_SKILL_MAP as Map<string, SkillEntry>).set(
            canonical,
            newEntry,
          );
          patternsDirty = true;
        }
        ALIAS_TO_CANONICAL.set(canonical, canonical);
      } else {
        const target = ALIAS_TO_CANONICAL.get(canonical) ?? canonical;
        const entry = SKILL_DICTIONARY.find((e) => e.canonical === target);
        if (entry && !entry.aliases.includes(raw)) {
          entry.aliases.push(raw);
        }
        ALIAS_TO_CANONICAL.set(raw, target);
        patternsDirty = true;
      }
      approvedLoaded++;
    }
  }

  if (patternsDirty) {
    SEARCH_PATTERNS = buildSearchPatterns();
  }

  return { approvedLoaded, rejectedLoaded };
};

export const recordUnrecognizedSkillToken = (
  rawToken: string,
  source = "UNKNOWN",
  context?: string,
): void => {
  const cleaned = rawToken
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\s,;:()[\]]+$/g, "")
    .replace(/^[\s,;:()[\]]+/g, "")
    .trim();

  if (
    !cleaned ||
    cleaned.length < 2 ||
    cleaned.length > 42 ||
    /^\d+$/.test(cleaned) ||
    NOISE_STOPWORDS.has(cleaned) ||
    ALIAS_TO_CANONICAL.has(cleaned) ||
    dismissedTokensCache.has(cleaned)
  ) {
    return;
  }

  const now = new Date().toISOString();
  const existing = unrecognizedReviewQueue.get(cleaned);
  if (existing) {
    existing.occurrences += 1;
    existing.lastSeenAt = now;
    if (!existing.sources.includes(source)) {
      existing.sources.push(source);
    }
    if (
      context &&
      existing.sampleContexts.length < 3 &&
      !existing.sampleContexts.includes(context)
    ) {
      existing.sampleContexts.push(context.slice(0, 120));
    }
  } else {
    unrecognizedReviewQueue.set(cleaned, {
      token: cleaned,
      occurrences: 1,
      sources: [source],
      sampleContexts: context ? [context.slice(0, 120)] : [],
      firstSeenAt: now,
      lastSeenAt: now,
      status: "PENDING",
    });
  }

  // Persist PENDING token asynchronously so review queue survives restarts
  if (process.env.NODE_ENV !== "test" && prisma?.ontologyAlias?.upsert) {
    void prisma.ontologyAlias
      .upsert({
        where: {
          rawSkill_canonicalSkill: {
            rawSkill: cleaned,
            canonicalSkill: cleaned,
          },
        },
        create: {
          rawSkill: cleaned,
          canonicalSkill: cleaned,
          status: "PENDING",
        },
        update: {},
      })
      .catch(() => null);
  }
};

export const listUnrecognizedSkillQueue = async (): Promise<
  UnrecognizedSkillRecord[]
> => {
  if (prisma?.ontologyAlias?.findMany) {
    try {
      const dbRows = await prisma.ontologyAlias.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
      });

      for (const row of dbRows) {
        const key = row.rawSkill.toLowerCase().trim();
        const mappedStatus: UnrecognizedSkillRecord["status"] =
          row.status === "REJECTED"
            ? "DISMISSED"
            : row.status === "APPROVED"
              ? row.rawSkill === row.canonicalSkill
                ? "APPROVED_CANONICAL"
                : "MAPPED_ALIAS"
              : "PENDING";

        const existing = unrecognizedReviewQueue.get(key);
        if (existing) {
          existing.status = mappedStatus;
          if (row.status === "APPROVED") {
            existing.resolvedTo = row.canonicalSkill;
          }
        } else {
          unrecognizedReviewQueue.set(key, {
            token: key,
            occurrences: 1,
            sources: ["DATABASE"],
            sampleContexts: [],
            firstSeenAt: row.createdAt.toISOString(),
            lastSeenAt: row.updatedAt.toISOString(),
            status: mappedStatus,
            ...(row.status === "APPROVED"
              ? { resolvedTo: row.canonicalSkill }
              : {}),
          });
        }
      }
    } catch {
      // Fallback to in-memory records in isolated unit tests
    }
  }

  return [...unrecognizedReviewQueue.values()].sort(
    (a, b) =>
      Number(b.status === "PENDING") - Number(a.status === "PENDING") ||
      b.occurrences - a.occurrences ||
      a.token.localeCompare(b.token),
  );
};

export const resolveUnrecognizedSkillToken = async (params: {
  token: string;
  action: "APPROVE_CANONICAL" | "MAP_ALIAS" | "DISMISS";
  targetCanonical?: string;
  family?: SkillFamily;
  createdBy?: string;
}): Promise<UnrecognizedSkillRecord | null> => {
  const key = params.token.toLowerCase().trim();
  const record = unrecognizedReviewQueue.get(key);

  if (params.action === "DISMISS") {
    dismissedTokensCache.add(key);
    if (prisma?.ontologyAlias?.upsert) {
      await prisma.ontologyAlias.deleteMany({
        where: { rawSkill: key, status: "PENDING" },
      });
      await prisma.ontologyAlias.upsert({
        where: {
          rawSkill_canonicalSkill: { rawSkill: key, canonicalSkill: key },
        },
        create: {
          rawSkill: key,
          canonicalSkill: key,
          status: "REJECTED",
          createdBy: params.createdBy ?? null,
        },
        update: {
          status: "REJECTED",
          createdBy: params.createdBy ?? null,
        },
      });
    }
    if (record) {
      record.status = "DISMISSED";
      return record;
    }
    return {
      token: key,
      occurrences: 1,
      sources: ["REVIEW"],
      sampleContexts: [],
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      status: "DISMISSED",
    };
  }

  if (params.action === "MAP_ALIAS" && params.targetCanonical) {
    const target =
      ALIAS_TO_CANONICAL.get(params.targetCanonical.toLowerCase().trim()) ??
      params.targetCanonical.toLowerCase().trim();
    const entry = SKILL_DICTIONARY.find((e) => e.canonical === target);
    if (entry && !entry.aliases.includes(key)) {
      entry.aliases.push(key);
    }
    ALIAS_TO_CANONICAL.set(key, target);
    dismissedTokensCache.delete(key);
    SEARCH_PATTERNS = buildSearchPatterns();

    if (prisma?.ontologyAlias?.upsert) {
      await prisma.ontologyAlias.deleteMany({
        where: { rawSkill: key, status: "PENDING" },
      });
      await prisma.ontologyAlias.upsert({
        where: {
          rawSkill_canonicalSkill: { rawSkill: key, canonicalSkill: target },
        },
        create: {
          rawSkill: key,
          canonicalSkill: target,
          status: "APPROVED",
          createdBy: params.createdBy ?? null,
        },
        update: {
          status: "APPROVED",
          createdBy: params.createdBy ?? null,
        },
      });
    }

    if (record) {
      record.status = "MAPPED_ALIAS";
      record.resolvedTo = target;
      return record;
    }
    return {
      token: key,
      occurrences: 1,
      sources: ["REVIEW"],
      sampleContexts: [],
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      status: "MAPPED_ALIAS",
      resolvedTo: target,
    };
  }

  if (params.action === "APPROVE_CANONICAL") {
    const family: SkillFamily = params.family ?? "backend";
    if (!CANONICAL_SKILL_MAP.has(key)) {
      const newEntry: SkillEntry = {
        canonical: key,
        aliases: [key],
        family,
        tier: "core",
      };
      SKILL_DICTIONARY.push(newEntry);
      (CANONICAL_SKILL_MAP as Map<string, SkillEntry>).set(key, newEntry);
      ALIAS_TO_CANONICAL.set(key, key);
      SEARCH_PATTERNS = buildSearchPatterns();
    }
    dismissedTokensCache.delete(key);

    if (prisma?.ontologyAlias?.upsert) {
      await prisma.ontologyAlias.upsert({
        where: {
          rawSkill_canonicalSkill: { rawSkill: key, canonicalSkill: key },
        },
        create: {
          rawSkill: key,
          canonicalSkill: key,
          status: "APPROVED",
          createdBy: params.createdBy ?? null,
        },
        update: {
          status: "APPROVED",
          createdBy: params.createdBy ?? null,
        },
      });
    }

    if (record) {
      record.status = "APPROVED_CANONICAL";
      record.resolvedTo = key;
      return record;
    }
    return {
      token: key,
      occurrences: 1,
      sources: ["REVIEW"],
      sampleContexts: [],
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      status: "APPROVED_CANONICAL",
      resolvedTo: key,
    };
  }

  return record ?? null;
};

// =========================================================================
// FALSE-POSITIVE BOUNDARY SUITE & EXTRACTION ACCURACY BENCHMARK
// =========================================================================

export interface FalsePositiveAuditCase {
  id: string;
  text: string;
  forbiddenSkill: string;
  expectedSkill: string | null;
  passed: boolean;
  detectedSkills: string[];
}

const FALSE_POSITIVE_CASES: Array<{
  id: string;
  text: string;
  forbiddenSkill: string;
  expectedSkill: string | null;
}> = [
  {
    id: "fp-java-vs-js",
    text: "Built interactive dashboards using JavaScript and React.",
    forbiddenSkill: "java",
    expectedSkill: "javascript",
  },
  {
    id: "fp-git-vs-digital",
    text: "Led digital transformation and agile product delivery.",
    forbiddenSkill: "git",
    expectedSkill: "agile",
  },
  {
    id: "fp-go-vs-goalkeeper",
    text: "Our goal is to deliver high-throughput microservices.",
    forbiddenSkill: "go",
    expectedSkill: "microservices",
  },
  {
    id: "fp-sass-vs-passion",
    text: "Passionate engineer with strong SQL and PostgreSQL skills.",
    forbiddenSkill: "sass",
    expectedSkill: "postgresql",
  },
  {
    id: "fp-rust-vs-rustic",
    text: "Trusted platform handling distributed systems workloads.",
    forbiddenSkill: "rust",
    expectedSkill: "distributed systems",
  },
  {
    id: "fp-swift-vs-swiftly",
    text: "Swiftly resolved Kubernetes pod scheduling bottlenecks.",
    forbiddenSkill: "swift",
    expectedSkill: "kubernetes",
  },
  {
    id: "fp-dart-vs-standard",
    text: "Enforced standard REST API conventions and OAuth2.",
    forbiddenSkill: "dart",
    expectedSkill: "rest api",
  },
  {
    id: "fp-express-vs-expressway",
    text: "Expressive TypeScript APIs backed by Redis caching.",
    forbiddenSkill: "express.js",
    expectedSkill: "typescript",
  },
];

export const runFalsePositiveAudit = (): {
  totalCases: number;
  passedCases: number;
  passRatePct: number;
  cases: FalsePositiveAuditCase[];
} => {
  const cases: FalsePositiveAuditCase[] = FALSE_POSITIVE_CASES.map((tc) => {
    const detected = [...countSkillMentions(tc.text).keys()];
    const hasForbidden = detected.includes(tc.forbiddenSkill);
    const hasExpected =
      tc.expectedSkill === null ? true : detected.includes(tc.expectedSkill);
    return {
      ...tc,
      passed: !hasForbidden && hasExpected,
      detectedSkills: detected,
    };
  });

  const passedCases = cases.filter((c) => c.passed).length;
  return {
    totalCases: cases.length,
    passedCases,
    passRatePct: Math.round((passedCases / cases.length) * 100),
    cases,
  };
};

const EXTRACTION_BENCHMARK_JDS: Array<{
  title: string;
  description: string;
  expectedSkills: string[];
}> = [
  {
    title: "Senior Full-Stack Engineer",
    description:
      "We need a Senior Full-Stack Engineer proficient in React, TypeScript, Next.js, Node.js, PostgreSQL, Redis, Docker, and AWS.",
    expectedSkills: [
      "react",
      "typescript",
      "next.js",
      "node.js",
      "postgresql",
      "redis",
      "docker",
      "aws",
    ],
  },
  {
    title: "Staff Platform & DevOps Engineer",
    description:
      "Own Kubernetes (K8s), Helm, Terraform (IaC), ArgoCD, GitHub Actions, Prometheus, Grafana, and Linux production infrastructure.",
    expectedSkills: [
      "kubernetes",
      "helm",
      "terraform",
      "argocd",
      "github actions",
      "prometheus",
      "grafana",
      "linux",
    ],
  },
  {
    title: "Senior AI / LLM Engineer",
    description:
      "Build production RAG pipelines using Python, PyTorch, LangChain, Vector Database (Pinecone), FastAPI, and Docker.",
    expectedSkills: [
      "rag",
      "python",
      "pytorch",
      "langchain",
      "vector database",
      "fastapi",
      "docker",
    ],
  },
  {
    title: "Application Security & Mobile Lead",
    description:
      "Secure iOS (Swift, SwiftUI) and Android (Kotlin, Jetpack Compose) apps with OAuth2, JWT, OWASP Top 10, and DevSecOps.",
    expectedSkills: [
      "ios",
      "swift",
      "swiftui",
      "android",
      "kotlin",
      "jetpack compose",
      "oauth",
      "jwt",
      "owasp",
      "devsecops",
    ],
  },
];

export const runExtractionAccuracyBenchmark = () => {
  let totalExpected = 0;
  let totalTruePositives = 0;
  let totalPredicted = 0;

  const samples = EXTRACTION_BENCHMARK_JDS.map((sample) => {
    const extracted = [...countSkillMentions(sample.description).keys()];
    const expectedSet = new Set(sample.expectedSkills);
    const hits = extracted.filter((s) => expectedSet.has(s));

    totalExpected += sample.expectedSkills.length;
    totalTruePositives += hits.length;
    totalPredicted += extracted.length;

    const recall = Math.round(
      (hits.length / sample.expectedSkills.length) * 100,
    );
    const precision =
      extracted.length > 0
        ? Math.round((hits.length / extracted.length) * 100)
        : 100;

    return {
      title: sample.title,
      expectedCount: sample.expectedSkills.length,
      extractedCount: extracted.length,
      matchedCount: hits.length,
      recallPct: recall,
      precisionPct: precision,
    };
  });

  const recallPct =
    totalExpected > 0
      ? Math.round((totalTruePositives / totalExpected) * 100)
      : 100;
  const precisionPct =
    totalPredicted > 0
      ? Math.round((totalTruePositives / totalPredicted) * 100)
      : 100;
  const f1Pct =
    precisionPct + recallPct > 0
      ? Math.round((2 * precisionPct * recallPct) / (precisionPct + recallPct))
      : 100;

  return {
    precisionPct,
    recallPct,
    f1Pct,
    samples,
  };
};
