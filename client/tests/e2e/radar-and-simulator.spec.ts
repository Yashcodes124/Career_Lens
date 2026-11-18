import { expect, test } from "@playwright/test";
import { E2E_USERS } from "./fixtures/users.js";
import { apiRequest } from "./helpers/api.js";
import { authenticatePage, loginViaApi } from "./helpers/auth.js";
import { resetAndSeedTestDatabase, testPrisma } from "./helpers/db.js";

test.describe("Journey 6: Role-Fit Radar & Multi-Skill What-If Simulator", () => {
  test("renders 5 radar buckets, single-skill breakout projection, and multi-skill simulator toggles", async ({
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
          title: "Radar Resume",
          rawText:
            "Experience\nBuilt React, TypeScript, and Node.js web services.",
        },
      },
    );
    const resumeId = resumeRes.data.resume.id;

    // Mark React as already verified strong
    await testPrisma.userSkill.create({
      data: {
        userId: seeded.userA.id,
        skill: "react",
        status: "STRONG",
        evidence: "Verified in mock interview",
      },
    });

    await authenticatePage(page, userA);

    // 1. Open Role-Fit Radar and verify 5 strategic buckets
    await page.goto("/radar");
    await expect(page.getByText(/Top Best-Fit Roles/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/\+1 Skill Breakouts/i)).toBeVisible();
    await expect(page.getByText(/Evidence-Shifted/i)).toBeVisible();
    await expect(page.getByText(/Needs Validation/i)).toBeVisible();
    await expect(page.getByText(/Deprioritize/i)).toBeVisible();

    // Verify +1 skill breakout projection badge is displayed
    await expect(page.getByText(/\+1 skill \(/i).first()).toBeVisible();

    // 2. Test Multi-Skill What-If Simulator endpoint (selecting postgresql + docker jumps 60% -> 100%)
    const simRes = await apiRequest<{
      data: {
        baselineScore: number;
        projectedScore: number;
        scoreDeltaPct: number;
        disclaimer: string;
        skillStateTransitions: Array<{ skill: string; afterStatus: string }>;
      };
    }>("/matches/simulate", {
      method: "POST",
      token: userA.token,
      body: {
        resumeId,
        jobId: job.id,
        selectedSkills: ["postgresql", "docker", "react"],
      },
    });

    expect(simRes.status).toBe(200);
    expect(simRes.data.data.baselineScore).toBe(60);
    expect(simRes.data.data.projectedScore).toBe(100);
    expect(simRes.data.data.scoreDeltaPct).toBe(40);
    expect(simRes.data.data.disclaimer).toContain("Simulated readiness");

    const reactState = simRes.data.data.skillStateTransitions.find(
      (s) => s.skill === "react",
    );
    expect(reactState?.afterStatus).toBe("ALREADY_VERIFIED");
  });
});