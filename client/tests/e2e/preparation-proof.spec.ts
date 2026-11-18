import { expect, test } from "@playwright/test";
import { E2E_USERS } from "./fixtures/users.js";
import { apiRequest } from "./helpers/api.js";
import { authenticatePage, loginViaApi } from "./helpers/auth.js";
import { resetAndSeedTestDatabase } from "./helpers/db.js";

test.describe("Journey 5: Preparation-to-Proof Loop", () => {
  test("validates malformed URLs, accepts GitHub/project/certification/bullet proofs, and recalculates readiness and match score", async ({
    page,
  }) => {
    const seeded = await resetAndSeedTestDatabase();
    const job = seeded.jobs[0]; // react, typescript, node.js, postgresql, docker
    const userA = await loginViaApi(
      E2E_USERS.candidateA.email,
      E2E_USERS.candidateA.password,
    );

    const resumeRes = await apiRequest<{ resume: { id: string } }>(
      "/resumes/paste",
      {
        method: "POST",
        token: userA.token,
        body: {
          title: "Base Resume",
          rawText: "Experience\nBuilt React and TypeScript web applications.",
        },
      },
    );
    const resumeId = resumeRes.data.resume.id;

    // 1. Reject malformed GitHub URL
    const badUrlRes = await apiRequest("/readiness/proof", {
      method: "POST",
      token: userA.token,
      body: {
        skill: "docker",
        proofType: "GITHUB_LINK",
        url: "not-a-valid-url",
        description: "Multi-stage container build with health checks",
      },
    });
    expect(badUrlRes.status).toBe(400);

    // 2. Open Skill Gap page & submit GitHub proof via UI
    await authenticatePage(page, userA);
    await page.goto(`/skill-gaps/${job.id}?resumeId=${resumeId}`);
    await expect(
      page.getByText(/Recommended Project \/ Practice Task/i),
    ).toBeVisible({ timeout: 15_000 });

    await page
      .getByPlaceholder(/https:\/\/github\.com\/username\/project/i)
      .fill("https://github.com/alexrivera/docker-prod-service");
    await page
      .getByPlaceholder(/Describe what you built/i)
      .fill(
        "Built multi-stage Docker container image with health checks and non-root runtime user.",
      );
    await page
      .getByRole("button", { name: /Submit proof & recalculate/i })
      .click();

    await expect(
      page.getByText(/Preparation-to-Proof Loop Updated/i),
    ).toBeVisible({ timeout: 10_000 });

    // 3. Submit Certification & Resume Bullet proofs via API and verify recalculated match score
    const certRes = await apiRequest("/readiness/proof", {
      method: "POST",
      token: userA.token,
      body: {
        skill: "postgresql",
        proofType: "CERTIFICATION",
        title: "PostgreSQL Performance Tuning",
        description: "Completed query planner and B-tree/GIN indexing benchmark lab.",
        jobId: job.id,
        resumeId,
      },
    });
    expect(certRes.status).toBe(200);

    const bulletRes = await apiRequest<{
      data: { updatedMatch: { score: number } };
    }>("/readiness/proof", {
      method: "POST",
      token: userA.token,
      body: {
        skill: "node.js",
        proofType: "RESUME_BULLET",
        description:
          "Architected Node.js API gateway handling 12,000 req/s with 99.95% uptime.",
        jobId: job.id,
        resumeId,
      },
    });
    expect(bulletRes.status).toBe(200);
    // All 5 skills (React, TypeScript, Docker, PostgreSQL, Node.js) now verified -> 100% match!
    expect(bulletRes.data.data.updatedMatch.score).toBe(100);
  });
});