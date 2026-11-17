export const E2E_USERS = {
  candidateA: {
    name: "Alex Rivera",
    email: "alex.e2e@truehire.test",
    password: "Password@1234",
  },
  candidateB: {
    name: "Samira Patel",
    email: "samira.e2e@truehire.test",
    password: "Password@1234",
  },
  admin: {
    name: "TrueHire Admin",
    email: "admin.e2e@truehire.test",
    password: "AdminPassword@1234",
    role: "ADMIN" as const,
  },
};

export const SEEDED_JOBS = [
  {
    externalId: "e2e-gh-fullstack-1",
    source: "GREENHOUSE" as const,
    title: "Senior Full-Stack Engineer",
    company: "Stripe",
    location: "Remote",
    description:
      "We are hiring a Senior Full-Stack Engineer with React, TypeScript, Node.js, PostgreSQL, and Docker. React and TypeScript are used daily. Docker and PostgreSQL power production.",
    requirements: ["react", "typescript", "node.js", "postgresql", "docker"],
    salaryRange: "$180k - $220k",
    url: "https://boards.greenhouse.io/stripe/jobs/e2e-1",
    isActive: true,
  },
  {
    externalId: "e2e-lever-platform-2",
    source: "LEVER" as const,
    title: "Staff Platform & Kubernetes Engineer",
    company: "Linear",
    location: "San Francisco, CA",
    description:
      "Own Kubernetes, Docker, Terraform, Prometheus, and Linux infrastructure at scale.",
    requirements: ["kubernetes", "docker", "terraform", "prometheus", "linux"],
    salaryRange: "$200k - $245k",
    url: "https://jobs.lever.co/linear/e2e-2",
    isActive: true,
  },
  {
    externalId: "e2e-ashby-ml-3",
    source: "ASHBY" as const,
    title: "Staff CUDA & Kernel Systems Engineer",
    company: "Anthropic",
    location: "San Francisco, CA",
    description:
      "Low-level GPU kernel optimization using Rust, CUDA, C++, PyTorch, and Linux.",
    requirements: ["rust", "cuda", "c++", "pytorch", "linux"],
    salaryRange: "$250k - $320k",
    url: "https://jobs.ashbyhq.com/anthropic/e2e-3",
    isActive: true,
  },
];
