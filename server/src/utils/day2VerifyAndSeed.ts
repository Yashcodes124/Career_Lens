import OpenAI from "openai";
import { prisma } from "../config/db";
import { env } from "../config/env";

const FALLBACK_VERIFIED_JOBS = [
  {
    externalId: "gh-stripe-fullstack-2026-01",
    source: "GREENHOUSE",
    title: "Full Stack Software Engineer, Checkout & Payment Links",
    company: "Stripe",
    location: "Bengaluru, India / Remote",
    description:
      "Build high-converting, low-latency payment surfaces used by millions of businesses globally. You will architect full-stack features using React, TypeScript, Node.js, Java, PostgreSQL, and distributed APIs while maintaining strict reliability and observability standards.",
    requirements: [
      "React",
      "TypeScript",
      "Node.js",
      "Java",
      "PostgreSQL",
      "REST APIs",
      "Git",
      "Docker",
      "System Design",
    ],
    salaryRange: "$110,000 - $155,000",
    url: "https://stripe.com/jobs",
    isActive: true,
  },
  {
    externalId: "gh-vercel-frontend-platform-2026-02",
    source: "GREENHOUSE",
    title: "Product Engineer, Frontend Cloud & DX",
    company: "Vercel",
    location: "Remote",
    description:
      "Own the developer experience for deployments, logs, and observability dashboards. Work deeply with React, TypeScript, Tailwind CSS, Next.js, Node.js, and PostgreSQL to deliver sub-100ms UI interactions.",
    requirements: [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Node.js",
      "Next.js",
      "PostgreSQL",
      "GraphQL",
      "Testing",
    ],
    salaryRange: "$125,000 - $170,000",
    url: "https://vercel.com/careers",
    isActive: true,
  },
  {
    externalId: "gh-cloudflare-backend-systems-2026-03",
    source: "GREENHOUSE",
    title: "Software Engineer — API Gateway & Zero Trust",
    company: "Cloudflare",
    location: "Hybrid / Remote",
    description:
      "Design and scale control-plane APIs and data pipelines serving millions of requests per second. Strong fundamentals in TypeScript, Node.js, Go or Java, PostgreSQL, Redis, Docker, and Linux networking.",
    requirements: [
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "Redis",
      "Docker",
      "REST APIs",
      "Linux",
      "Distributed Systems",
    ],
    salaryRange: "$115,000 - $160,000",
    url: "https://www.cloudflare.com/careers/",
    isActive: true,
  },
  {
    externalId: "gh-datadog-fullstack-apm-2026-04",
    source: "GREENHOUSE",
    title: "Software Engineer — Full Stack Observability",
    company: "Datadog",
    location: "Remote / New York",
    description:
      "Build real-time trace visualization and alerting workflows. Collaborate across frontend React/TypeScript components and high-throughput backend services backed by PostgreSQL and Kafka.",
    requirements: [
      "React",
      "TypeScript",
      "JavaScript",
      "Node.js",
      "PostgreSQL",
      "Docker",
      "AWS",
      "CI/CD",
    ],
    salaryRange: "$120,000 - $165,000",
    url: "https://careers.datadoghq.com/",
    isActive: true,
  },
];

async function runDiagnosticsAndSeed() {
  console.log("=== TrueHire Day 2 Backend & AI Diagnostic ===\n");

  // 1. Check PostgreSQL connectivity & existing job count
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    const jobCount = await prisma.job.count({ where: { isActive: true } });
    console.log(
      `[1/3] PostgreSQL Connected (Users: ${userCount}, Active Jobs: ${jobCount})`,
    );

    if (jobCount === 0) {
      console.log(
        "      -> Seeding initial verified ATS jobs into PostgreSQL...",
      );
      for (const job of FALLBACK_VERIFIED_JOBS) {
        await prisma.job.upsert({
          where: { externalId: job.externalId },
          update: { ...job, lastSyncedAt: new Date() },
          create: job,
        });
      }
      const updatedCount = await prisma.job.count({
        where: { isActive: true },
      });
      console.log(
        `      -> Seeded ${updatedCount} verified jobs successfully.`,
      );
    }
  } catch (dbErr) {
    console.error("[1/3] PostgreSQL Connection FAILED:", dbErr);
    process.exit(1);
  }

  // 2. Check AI Provider Configuration & Live Response
  if (!env.resolvedAiApiKey) {
    console.warn(
      "[2/3] AI API Key is empty in .env. Paste your key into NVIDIA_API_KEY to enable live AI calls.",
    );
  } else {
    console.log(
      `[2/3] Testing AI Provider (${env.AI_BASE_URL}) with model "${env.NVIDIA_MODEL}"...`,
    );
    try {
      const client = new OpenAI({
        apiKey: env.resolvedAiApiKey,
        baseURL: env.AI_BASE_URL,
        timeout: env.AI_TIMEOUT_MS,
      });

      const start = Date.now();
      const completion = await client.chat.completions.create({
        model: env.NVIDIA_MODEL,
        messages: [
          {
            role: "system",
            content:
              'Reply only with valid JSON: {"status":"ok","provider":"connected"}',
          },
          { role: "user", content: "ping" },
        ],
        temperature: 0.1,
        max_tokens: 50,
      });

      const latency = Date.now() - start;
      const reply = completion.choices[0]?.message?.content?.trim();
      console.log(`      -> AI Responded in ${latency}ms: ${reply}`);
    } catch (aiErr) {
      console.error(
        `      -> AI Call Failed with model "${env.NVIDIA_MODEL}":`,
        aiErr instanceof Error ? aiErr.message : aiErr,
      );
      console.log(
        "      -> Tip: Set NVIDIA_MODEL=meta/llama-3.1-70b-instruct in .env for the fastest & most reliable NVIDIA NIM free model.",
      );
    }
  }

  console.log("\n[3/3] Day 2 Diagnostic Complete!");
  await prisma.$disconnect();
}

runDiagnosticsAndSeed();
