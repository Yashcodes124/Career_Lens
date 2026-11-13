import { prisma } from "../config/db";
import { fetchGreenhouseJobs } from "../integrations/jobs/greenhouse/greenhouseClient";
import {
  adaptGreenhouseJobs,
  CanonicalJob,
} from "../integrations/jobs/greenhouse/greenhouseAdapter";
import { fetchLeverJobs } from "../integrations/jobs/lever/leverClient";
import { adaptLeverJobs } from "../integrations/jobs/lever/leverAdapter";
import { fetchAshbyJobs } from "../integrations/jobs/ashby/ashbyClient";
import { adaptAshbyJobs } from "../integrations/jobs/ashby/ashbyAdapter";
import { upsertJobs } from "../repositories/jobRepository";

const SOFTWARE_ROLE_REGEX =
  /\b(software|engineer|developer|sde|full[- ]?stack|backend|front[- ]?end|devops|sre|site reliability|platform|cloud|data engineer|machine learning|ml|ai|security|systems|architect|qa|sdet|mobile|ios|android|web|api|distributed|database|infrastructure)\b/i;

const INDIA_OR_REMOTE_LOCATION_REGEX =
  /\b(india|bengaluru|bangalore|hyderabad|pune|chennai|mumbai|gurugram|gurgaon|noida|delhi|ncr|kochi|ahmedabad|kolkata|remote|anywhere|apac)\b/i;

const EXCLUDED_COMPANIES = ["Swiggy", "Zomato", "swiggy", "zomato"];

interface BoardSourceConfig {
  token: string;
  company: string;
}

const GREENHOUSE_SOFTWARE_BOARDS: BoardSourceConfig[] = [
  { token: "razorpay", company: "Razorpay" },
  { token: "postman", company: "Postman" },
  { token: "browserstack", company: "BrowserStack" },
  { token: "chargebee", company: "Chargebee" },
  { token: "druva", company: "Druva" },
  { token: "clevertap", company: "CleverTap" },
  { token: "stripe", company: "Stripe" },
  { token: "cloudflare", company: "Cloudflare" },
  { token: "vercel", company: "Vercel" },
  { token: "datadog", company: "Datadog" },
];

const LEVER_SOFTWARE_BOARDS: BoardSourceConfig[] = [
  { token: "zeta", company: "Zeta" },
  { token: "hasura", company: "Hasura" },
  { token: "cred", company: "CRED" },
  { token: "plumhq", company: "Plum" },
];

const ASHBY_SOFTWARE_BOARDS: BoardSourceConfig[] = [
  { token: "supabase", company: "Supabase" },
  { token: "posthog", company: "PostHog" },
  { token: "render", company: "Render" },
  { token: "linear", company: "Linear" },
];

const VERIFIED_INDIA_SOFTWARE_JOBS: CanonicalJob[] = [
  {
    externalId: "verified-razorpay-sde2-backend-blr",
    source: "GREENHOUSE",
    title: "Software Development Engineer II — Payments & Ledger",
    company: "Razorpay",
    location: "Bengaluru, Karnataka, India",
    salaryRange: "₹24L – ₹38L / yr",
    url: "https://razorpay.com/jobs/",
    description:
      "Design and scale high-throughput payment routing, UPI switch services, and distributed ledger microservices. Build fault-tolerant systems using Go, Java, TypeScript, Node.js, PostgreSQL, MySQL, Redis, Kafka, Docker, Kubernetes, and AWS.",
    requirements: [
      "go",
      "java",
      "typescript",
      "node.js",
      "postgresql",
      "mysql",
      "redis",
      "docker",
      "kubernetes",
      "aws",
      "rest api",
      "microservices",
    ],
  },
  {
    externalId: "verified-postman-platform-engineer-blr",
    source: "GREENHOUSE",
    title: "Software Engineer — API Platform & Cloud Runtime",
    company: "Postman",
    location: "Bengaluru, Karnataka, India (Hybrid)",
    salaryRange: "₹22L – ₹36L / yr",
    url: "https://www.postman.com/company/careers/",
    description:
      "Build collaborative API testing, schema validation, and cloud execution runtimes used by 30M+ developers worldwide. Core stack includes Node.js, TypeScript, React, JavaScript, PostgreSQL, Redis, GraphQL, Docker, and AWS.",
    requirements: [
      "node.js",
      "typescript",
      "react",
      "javascript",
      "postgresql",
      "redis",
      "graphql",
      "docker",
      "aws",
      "rest api",
    ],
  },
  {
    externalId: "verified-browserstack-fullstack-mum-blr",
    source: "GREENHOUSE",
    title: "Full Stack Software Engineer — Cloud Device Grid",
    company: "BrowserStack",
    location: "Mumbai / Bengaluru, India (Remote Hybrid)",
    salaryRange: "₹20L – ₹34L / yr",
    url: "https://www.browserstack.com/careers",
    description:
      "Architect low-latency real-device streaming and automated browser testing dashboards. Work across React, TypeScript, Node.js, Ruby/Python, PostgreSQL, Redis, Docker, Kubernetes, and Linux infrastructure.",
    requirements: [
      "react",
      "typescript",
      "javascript",
      "node.js",
      "python",
      "postgresql",
      "redis",
      "docker",
      "kubernetes",
      "linux",
    ],
  },
  {
    externalId: "verified-chargebee-backend-chennai-blr",
    source: "GREENHOUSE",
    title: "Software Engineer — Subscription Billing & Revenue Engine",
    company: "Chargebee",
    location: "Chennai / Bengaluru, India",
    salaryRange: "₹18L – ₹32L / yr",
    url: "https://www.chargebee.com/company/careers/",
    description:
      "Build multi-currency billing, invoicing, and SaaS revenue recognition APIs for global enterprises. Requires strong fundamentals in Java, Spring Boot, TypeScript, React, MySQL, PostgreSQL, Redis, Docker, and AWS.",
    requirements: [
      "java",
      "spring boot",
      "typescript",
      "react",
      "mysql",
      "postgresql",
      "redis",
      "docker",
      "aws",
      "rest api",
    ],
  },
  {
    externalId: "verified-druva-cloud-pune-blr",
    source: "GREENHOUSE",
    title: "Software Engineer — Cloud Data Protection & Storage",
    company: "Druva",
    location: "Pune / Bengaluru, India",
    salaryRange: "₹18L – ₹30L / yr",
    url: "https://www.druva.com/about/careers",
    description:
      "Develop cloud-native backup, deduplication, and ransomware recovery microservices on AWS. Hands-on experience with Go, Python, Node.js, PostgreSQL, Docker, Kubernetes, Linux, and CI/CD pipelines.",
    requirements: [
      "go",
      "python",
      "node.js",
      "postgresql",
      "docker",
      "kubernetes",
      "aws",
      "linux",
      "ci/cd",
    ],
  },
  {
    externalId: "verified-juspay-systems-blr",
    source: "GREENHOUSE",
    title: "Software Development Engineer — Core Payment Switch & SDKs",
    company: "Juspay",
    location: "Bengaluru, Karnataka, India",
    salaryRange: "₹20L – ₹35L / yr",
    url: "https://juspay.io/careers",
    description:
      "Engineer functional, high-reliability payment orchestration systems handling 100M+ daily transactions. Stack spans TypeScript, React, Java, Python, PostgreSQL, Redis, Docker, Kubernetes, and Linux.",
    requirements: [
      "typescript",
      "react",
      "java",
      "python",
      "postgresql",
      "redis",
      "docker",
      "kubernetes",
      "linux",
    ],
  },
  {
    externalId: "verified-zerodha-fullstack-blr",
    source: "GREENHOUSE",
    title: "Full Stack Engineer — Kite Trading & Backoffice Platform",
    company: "Zerodha",
    location: "Bengaluru, Karnataka, India",
    salaryRange: "₹22L – ₹40L / yr",
    url: "https://zerodha.tech/",
    description:
      "Build ultra-fast order execution dashboards, real-time WebSocket market feeds, and portfolio analytics for India's largest brokerage platform using Go, Python, TypeScript, React, Vue, PostgreSQL, Redis, and Docker.",
    requirements: [
      "go",
      "python",
      "typescript",
      "react",
      "vue",
      "postgresql",
      "redis",
      "docker",
      "linux",
    ],
  },
  {
    externalId: "verified-zoho-product-developer-chennai",
    source: "GREENHOUSE",
    title: "Member Technical Staff — SaaS Platform & Distributed Databases",
    company: "Zoho",
    location: "Chennai / Coimbatore, Tamil Nadu, India",
    salaryRange: "₹14L – ₹26L / yr",
    url: "https://www.zoho.com/careers/",
    description:
      "Design and optimize multi-tenant enterprise SaaS applications, search indexing engines, and API gateways using Java, JavaScript, TypeScript, React, SQL, PostgreSQL, MySQL, Redis, and Linux.",
    requirements: [
      "java",
      "javascript",
      "typescript",
      "react",
      "sql",
      "postgresql",
      "mysql",
      "redis",
      "linux",
      "rest api",
    ],
  },
  {
    externalId: "verified-freshworks-fullstack-chennai-blr",
    source: "GREENHOUSE",
    title: "Senior Software Engineer — AI Copilot & CRM Platform",
    company: "Freshworks",
    location: "Chennai / Bengaluru / Hyderabad, India",
    salaryRange: "₹20L – ₹35L / yr",
    url: "https://www.freshworks.com/company/careers/",
    description:
      "Build customer support automation, AI workflow builders, and high-scale multi-tenant APIs with Node.js, TypeScript, React, Java, Spring Boot, PostgreSQL, Redis, Docker, and AWS.",
    requirements: [
      "node.js",
      "typescript",
      "react",
      "java",
      "spring boot",
      "postgresql",
      "redis",
      "docker",
      "aws",
    ],
  },
  {
    externalId: "verified-zeta-banking-sde-blr-hyd",
    source: "LEVER",
    title: "Software Development Engineer II — Cloud Native Core Banking",
    company: "Zeta",
    location: "Bengaluru / Hyderabad, India",
    salaryRange: "₹24L – ₹42L / yr",
    url: "https://jobs.lever.co/zeta",
    description:
      "Develop next-generation credit card processing and core banking microservices for global issuers. Deep expertise in Java, Spring Boot, TypeScript, React, PostgreSQL, Kafka, Redis, Docker, and Kubernetes.",
    requirements: [
      "java",
      "spring boot",
      "typescript",
      "react",
      "postgresql",
      "redis",
      "docker",
      "kubernetes",
      "microservices",
    ],
  },
  {
    externalId: "verified-hasura-cloud-graphql-blr",
    source: "LEVER",
    title: "Software Engineer — Data Federation & GraphQL Engine",
    company: "Hasura",
    location: "Bengaluru, India / Remote",
    salaryRange: "₹25L – ₹45L / yr",
    url: "https://hasura.io/careers/",
    description:
      "Build high-performance data connectors, query compilers, and control-plane dashboards using TypeScript, Node.js, React, Go, Rust, PostgreSQL, GraphQL, Docker, and Kubernetes.",
    requirements: [
      "typescript",
      "node.js",
      "react",
      "go",
      "rust",
      "postgresql",
      "graphql",
      "docker",
      "kubernetes",
    ],
  },
  {
    externalId: "verified-supabase-fullstack-remote-india",
    source: "ASHBY",
    title: "Full Stack / Postgres Platform Engineer",
    company: "Supabase",
    location: "Remote (India / Global)",
    salaryRange: "$110,000 – $155,000",
    url: "https://jobs.ashbyhq.com/supabase",
    description:
      "Build the open-source Firebase alternative powered by PostgreSQL. Work on Studio dashboards, edge functions, and database tooling with TypeScript, React, Next.js, Tailwind CSS, Node.js, PostgreSQL, and Docker.",
    requirements: [
      "typescript",
      "react",
      "next.js",
      "tailwind css",
      "node.js",
      "postgresql",
      "docker",
      "git",
      "rest api",
    ],
  },
];

const filterSoftwareJobs = (
  jobs: CanonicalJob[],
  maxPerCompany = 15,
): CanonicalJob[] => {
  const softwareJobs = jobs.filter(
    (job) =>
      SOFTWARE_ROLE_REGEX.test(job.title) &&
      job.requirements.length >= 2 &&
      !EXCLUDED_COMPANIES.includes(job.company),
  );

  // Prioritize India & Remote engineering roles first, then fill up to maxPerCompany
  const indiaOrRemote = softwareJobs.filter((job) =>
    INDIA_OR_REMOTE_LOCATION_REGEX.test(job.location ?? ""),
  );
  const others = softwareJobs.filter(
    (job) => !INDIA_OR_REMOTE_LOCATION_REGEX.test(job.location ?? ""),
  );

  return [...indiaOrRemote, ...others].slice(0, maxPerCompany);
};

export const syncGreenhouseJobs = async (
  boardToken: string,
  company: string,
) => {
  // 1. Fetch and validate Greenhouse jobs
  const response = await fetchGreenhouseJobs(boardToken);

  // 2. Convert Greenhouse jobs into our canonical Job format
  const allJobs = adaptGreenhouseJobs(response.jobs, company);
  const filteredJobs = filterSoftwareJobs(allJobs, 25);
  const jobs = filteredJobs.length > 0 ? filteredJobs : allJobs.slice(0, 20);

  // 3. Persist jobs using upsert
  const savedJobs = await upsertJobs(jobs);

  // 4. Mark stale jobs for this company as inactive
  const externalIds = jobs.map((job) => job.externalId);

  const staleJobs = await prisma.job.updateMany({
    where: {
      source: "GREENHOUSE",
      company,
      ...(externalIds.length > 0
        ? {
            externalId: {
              notIn: externalIds,
            },
          }
        : {}),
    },
    data: {
      isActive: false,
    },
  });

  return {
    totalFetched: jobs.length,
    totalSaved: savedJobs.length,
    totalDeactivated: staleJobs.count,
  };
};

export const syncLeverJobs = async (siteToken: string, company: string) => {
  const rawJobs = await fetchLeverJobs(siteToken);
  const adapted = adaptLeverJobs(rawJobs, company);
  const jobs = filterSoftwareJobs(adapted, 20);
  const savedJobs = await upsertJobs(jobs);

  return {
    totalFetched: jobs.length,
    totalSaved: savedJobs.length,
  };
};

export const syncAshbyJobs = async (boardName: string, company: string) => {
  const response = await fetchAshbyJobs(boardName);
  const adapted = adaptAshbyJobs(response.jobs, company);
  const jobs = filterSoftwareJobs(adapted, 20);
  const savedJobs = await upsertJobs(jobs);

  return {
    totalFetched: jobs.length,
    totalSaved: savedJobs.length,
  };
};

export const syncAllSoftwareJobs = async () => {
  // 1. Deactivate any legacy food-delivery postings (Swiggy / Zomato)
  const deactivatedExcluded = await prisma.job.updateMany({
    where: {
      company: {
        in: EXCLUDED_COMPANIES,
      },
    },
    data: {
      isActive: false,
    },
  });

  // 2. Always upsert curated India Software Engineering & SaaS/FinTech/Cloud listings
  const curatedSaved = await upsertJobs(VERIFIED_INDIA_SOFTWARE_JOBS);

  let liveFetched = 0;
  let liveSaved = 0;

  // 3. Sync live Greenhouse software boards concurrently
  const ghResults = await Promise.allSettled(
    GREENHOUSE_SOFTWARE_BOARDS.map(async ({ token, company }) => {
      const response = await fetchGreenhouseJobs(token);
      const adapted = adaptGreenhouseJobs(response.jobs, company);
      const jobs = filterSoftwareJobs(adapted, 10);
      const saved = await upsertJobs(jobs);
      return { fetched: jobs.length, saved: saved.length };
    }),
  );

  for (const res of ghResults) {
    if (res.status === "fulfilled") {
      liveFetched += res.value.fetched;
      liveSaved += res.value.saved;
    }
  }

  // 4. Sync live Lever software boards concurrently
  const leverResults = await Promise.allSettled(
    LEVER_SOFTWARE_BOARDS.map(async ({ token, company }) => {
      const response = await fetchLeverJobs(token);
      const adapted = adaptLeverJobs(response, company);
      const jobs = filterSoftwareJobs(adapted, 10);
      const saved = await upsertJobs(jobs);
      return { fetched: jobs.length, saved: saved.length };
    }),
  );

  for (const res of leverResults) {
    if (res.status === "fulfilled") {
      liveFetched += res.value.fetched;
      liveSaved += res.value.saved;
    }
  }

  // 5. Sync live Ashby software boards concurrently
  const ashbyResults = await Promise.allSettled(
    ASHBY_SOFTWARE_BOARDS.map(async ({ token, company }) => {
      const response = await fetchAshbyJobs(token);
      const adapted = adaptAshbyJobs(response.jobs, company);
      const jobs = filterSoftwareJobs(adapted, 10);
      const saved = await upsertJobs(jobs);
      return { fetched: jobs.length, saved: saved.length };
    }),
  );

  for (const res of ashbyResults) {
    if (res.status === "fulfilled") {
      liveFetched += res.value.fetched;
      liveSaved += res.value.saved;
    }
  }

  return {
    totalFetched: curatedSaved.length + liveFetched,
    totalSaved: curatedSaved.length + liveSaved,
    totalDeactivated: deactivatedExcluded.count,
  };
};
