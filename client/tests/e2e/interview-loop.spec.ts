import { expect, test } from "@playwright/test";
import { E2E_USERS } from "./fixtures/users.js";
import { apiRequest } from "./helpers/api.js";
import { authenticatePage, loginViaApi } from "./helpers/auth.js";
import { resetAndSeedTestDatabase } from "./helpers/db.js";

test.describe("Journey 4: Full Interview Closed Loop & Adaptive Follow-Ups", () => {
  test("enforces sequential answers, triggers adaptive follow-up, generates structured transcript, updates skill profile, and improves next match score", async ({
    page,
  }) => {
    const seeded = await resetAndSeedTestDatabase();
    const job = seeded.jobs[0]; // requires react, typescript, node.js, postgresql, docker
    const userA = await loginViaApi(
      E2E_USERS.candidateA.email,
      E2E_USERS.candidateA.password,
    );

    // Resume only lists React and TypeScript (40% initial match: 2/5)
    const resumeRes = await apiRequest<{ resume: { id: string } }>(
      "/resumes/paste",
      {
        method: "POST",
        token: userA.token,
        body: {
          title: "Frontend Resume",
          rawText:
            "Experience\nBuilt React and TypeScript single-page applications.",
        },
      },
    );
    const resumeId = resumeRes.data.resume.id;

    // Run baseline match (creates applicationId, score = 40%)
    const initialMatch = await apiRequest<{
      data: { score: number; applicationId: string };
    }>("/matches", {
      method: "POST",
      token: userA.token,
      body: { resumeId, jobId: job.id },
    });
    expect(initialMatch.data.data.score).toBe(40);
    const applicationId = initialMatch.data.data.applicationId;

    // Create & start interview
    const createdIv = await apiRequest<{ data: { id: string } }>("/interviews", {
      method: "POST",
      token: userA.token,
      body: {
        applicationId,
        durationMinutes: 15,
        difficulty: "MEDIUM",
        focusTopics: ["docker", "postgresql"],
      },
    });
    const interviewId = createdIv.data.data.id;

    const startedIv = await apiRequest<{
      data: { interview: { questions: Array<{ id: string; order: number }> } };
    }>(`/interviews/${interviewId}/start`, {
      method: "POST",
      token: userA.token,
    });
    const initialQuestions = startedIv.data.data.interview.questions;

    // 1. Out-of-order answer must be rejected with 409
    const outOfOrder = await apiRequest(
      `/interviews/${interviewId}/questions/${initialQuestions[1].id}/answer`,
      {
        method: "POST",
        token: userA.token,
        body: { answer: "Skipping question 1" },
      },
    );
    expect(outOfOrder.status).toBe(409);

    // 2. Answer Q1 with E2E_VAGUE -> triggers adaptive follow-up question!
    const q1Res = await apiRequest<{
      data: { adaptiveFollowUp: { triggered: boolean; trigger: string } | null };
    }>(
      `/interviews/${interviewId}/questions/${initialQuestions[0].id}/answer`,
      {
        method: "POST",
        token: userA.token,
        body: { answer: "E2E_VAGUE I use hooks." },
      },
    );
    expect(q1Res.status).toBe(200);
    expect(q1Res.data.data.adaptiveFollowUp?.triggered).toBe(true);
    expect(q1Res.data.data.adaptiveFollowUp?.trigger).toBe("VAGUE_ANSWER");

    // 3. Answer all remaining questions (including the dynamically inserted adaptive follow-up)
    let session = await apiRequest<{
      data: {
        status: string;
        questions: Array<{ id: string; answer: string | null }>;
      };
    }>(`/interviews/${interviewId}`, { token: userA.token });

    for (const q of session.data.data.questions) {
      if (!q.answer) {
        await apiRequest(
          `/interviews/${interviewId}/questions/${q.id}/answer`,
          {
            method: "POST",
            token: userA.token,
            body: {
              answer:
                "E2E_STRONG Implemented Docker multi-stage containers, PostgreSQL B-tree indexing, and idempotent Redis rate limiting with p99 latency under 45ms.",
            },
          },
        );
      }
    }

    // 4. Generate final evaluation & view structured transcript in UI
    const evalRes = await apiRequest(`/interviews/${interviewId}/evaluation`, {
      method: "POST",
      token: userA.token,
    });
    expect(evalRes.status).toBe(201);

    await authenticatePage(page, userA);
    await page.goto(`/interviews/${interviewId}/evaluation`);
    await expect(
      page.getByText(/Executive Evaluation Summary/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(/Follow-up recommendation:/i),
    ).toBeVisible();

    // 5. Verify Skill Profile updated & re-running match improves score from 40% -> 80% (4/5)
    await page.goto("/dashboard");
    await expect(
      page.getByText(/Verified Strengths/i),
    ).toBeVisible();

    const updatedMatch = await apiRequest<{ data: { score: number } }>(
      "/matches",
      {
        method: "POST",
        token: userA.token,
        body: { resumeId, jobId: job.id },
      },
    );
    expect(updatedMatch.data.data.score).toBeGreaterThan(40);
  });
});