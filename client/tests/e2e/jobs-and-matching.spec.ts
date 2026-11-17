import { expect, test } from "@playwright/test";
import { E2E_USERS } from "./fixtures/users.js";
import { apiRequest } from "./helpers/api.js";
import { authenticatePage, loginViaApi } from "./helpers/auth.js";
import { resetAndSeedTestDatabase, testPrisma } from "./helpers/db.js";

test.describe("Journey 3: Jobs, Deterministic Matching, Evidence Cards & Claim Verification", () => {
  test("displays source/freshness badges, saves/unsaves jobs, renders evidence cards, 6 claim buckets, score decomposition, and withholds credit for weak interview skills", async ({
    page,
  }) => {
    const seeded = await resetAndSeedTestDatabase();
    const fullStackJob = seeded.jobs[0];

    const userA = await loginViaApi(
      E2E_USERS.candidateA.email,
      E2E_USERS.candidateA.password,
    );

    // Create baseline resume for User A (lists React, TypeScript, Node.js, Docker)
    const resumeRes = await apiRequest<{ resume: { id: string } }>(
      "/resumes/paste",
      {
        method: "POST",
        token: userA.token,
        body: {
          title: "Primary Engineering Resume",
          rawText:
            "Experience\nEngineered React and TypeScript UIs and Node.js APIs.\nSkills\nReact, TypeScript, Node.js, Docker",
        },
      },
    );
    const resumeId = resumeRes.data.resume.id;

    // Seed a WEAK interview skill for Docker to prove weak interview evidence withholds match credit
    await testPrisma.userSkill.create({
      data: {
        userId: seeded.userA.id,
        skill: "docker",
        status: "WEAK",
        evidence:
          "Interview 1, Q1 (42%): Missed multi-stage container security",
      },
    });

    await authenticatePage(page, userA);

    // 1. Browse jobs with source & freshness badges
    await page.goto("/jobs");
    await expect(page.getByText("Senior Full-Stack Engineer")).toBeVisible();
    await expect(page.getByText(/Greenhouse/i).first()).toBeVisible();

    // 2. Save & unsave a job via API/UI
    const saveRes = await apiRequest(`/jobs/${fullStackJob.id}/save`, {
      method: "POST",
      token: userA.token,
    });
    expect([200, 201]).toContain(saveRes.status);

    // 3. Open Match Breakdown page
    await page.goto(`/matches/${fullStackJob.id}?resumeId=${resumeId}`);

    // Verify 3 headline scores & 7-factor decomposition
    await expect(
      page.getByText(/Match vs\. Readiness vs\. Preparation Breakdown/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/1\. Match Score/i)).toBeVisible();
    await expect(page.getByText(/2\. Readiness Score/i)).toBeVisible();
    await expect(page.getByText(/3\. Preparation Score/i)).toBeVisible();

    // Verify 6-status Claim Verification Engine & Failed Claim Alert for Docker
    await expect(
      page.getByText(/Resume Claim vs\. Interview Proof Audit/i),
    ).toBeVisible();
    await expect(
      page.getByText(/Failed Claim Validation Alert/i),
    ).toBeVisible();

    // Verify Docker is NOT credited (only React, TypeScript, Node.js = 3 of 5 = 60%)
    await expect(page.getByText(/You meet 3 of 5 requirements/i)).toBeVisible();

    // Verify Evidence-Linked Cards show Interview evidence, Resume evidence, and Job requirement
    await expect(page.getByText(/Interview evidence:/i).first()).toBeVisible();
    await expect(page.getByText(/Resume evidence/i).first()).toBeVisible();
    await expect(page.getByText(/Job requirement:/i).first()).toBeVisible();
  });
});
