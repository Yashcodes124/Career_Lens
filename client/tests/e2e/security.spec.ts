import { expect, test } from "@playwright/test";
import { E2E_USERS } from "./fixtures/users.js";
import { API_URL, apiRequest } from "./helpers/api.js";
import { loginViaApi } from "./helpers/auth.js";
import { resetAndSeedTestDatabase } from "./helpers/db.js";

test.describe("Journey 7: Security, Cross-User Isolation, RBAC, CORS & Error Sanitization", () => {
  test("blocks unauthenticated access, enforces cross-user isolation, restricts admin sync, rejects unauthorized CORS, rate-limits brute force, and sanitizes raw AI errors", async () => {
    const seeded = await resetAndSeedTestDatabase();
    const job = seeded.jobs[0];

    const userA = await loginViaApi(
      E2E_USERS.candidateA.email,
      E2E_USERS.candidateA.password,
    );
    const userB = await loginViaApi(
      E2E_USERS.candidateB.email,
      E2E_USERS.candidateB.password,
    );

    // 1. Unauthenticated API access is rejected (401)
    const unauthRes = await apiRequest("/resumes");
    expect(unauthRes.status).toBe(401);

    // 2. User A creates a resume, application, and interview; User B cannot access any of them
    const resumeA = await apiRequest<{ resume: { id: string } }>(
      "/resumes/paste",
      {
        method: "POST",
        token: userA.token,
        body: {
          title: "Private Resume A",
          rawText:
            "Experience\nBuilt React, TypeScript, Node.js, and PostgreSQL applications.",
        },
      },
    );
    const resumeAId = resumeA.data.resume.id;

    const matchA = await apiRequest<{ data: { applicationId: string } }>(
      "/matches",
      {
        method: "POST",
        token: userA.token,
        body: { resumeId: resumeAId, jobId: job.id },
      },
    );
    const appAId = matchA.data.data.applicationId;

    const ivA = await apiRequest<{ data: { id: string } }>("/interviews", {
      method: "POST",
      token: userA.token,
      body: { applicationId: appAId },
    });
    const ivAId = ivA.data.data.id;

    expect(
      (await apiRequest(`/resumes/${resumeAId}`, { token: userB.token })).status,
    ).toBe(404);
    expect(
      (await apiRequest(`/applications/${appAId}`, { token: userB.token }))
        .status,
    ).toBe(404);
    expect(
      (await apiRequest(`/interviews/${ivAId}`, { token: userB.token })).status,
    ).toBe(404);
    expect(
      (
        await apiRequest("/matches", {
          method: "POST",
          token: userB.token,
          body: { resumeId: resumeAId, jobId: job.id },
        })
      ).status,
    ).toBe(404);

    // 3. Non-admin cannot call admin sync endpoint (403)
    const nonAdminSync = await apiRequest("/jobs/sync/greenhouse", {
      method: "POST",
      token: userA.token,
    });
    expect(nonAdminSync.status).toBe(403);

    // 4. CORS rejects an unauthorized origin
    const corsRes = await fetch(`${API_URL}/health`, {
      headers: { Origin: "https://evil-attacker.example.com" },
    });
    expect(corsRes.headers.get("access-control-allow-origin")).toBeNull();

    // 5. Rate limit returns user-friendly 429 error on isolated IP
    let got429 = false;
    let rateLimitMessage = "";
    for (let i = 0; i < 12; i++) {
      const attempt = await apiRequest<{ message?: string; error?: string }>(
        "/auth/login",
        {
          method: "POST",
          headers: { "X-Forwarded-For": "10.250.250.99" },
          body: { email: "attacker@example.com", password: "wrong" },
        },
      );
      if (attempt.status === 429) {
        got429 = true;
        rateLimitMessage = attempt.data.message || attempt.data.error || "";
        break;
      }
    }
    expect(got429).toBe(true);
    expect(rateLimitMessage).toMatch(/Too many authentication attempts/i);

    // 6. Raw AI/provider error is never exposed in API/UI responses
    const aiFailRes = await apiRequest<{ message?: string; error?: string }>(
      "/resumes/paste",
      {
        method: "POST",
        token: userA.token,
        body: {
          title: "Trigger Error",
          rawText:
            "Experience\nE2E_FORCE_AI_ERROR Senior Engineer building cloud systems with React and Node.js.",
        },
      },
    );
    expect(aiFailRes.status).toBe(503);
    const serialized = JSON.stringify(aiFailRes.data);
    expect(serialized).not.toContain("sk_live_998877");
    expect(serialized).not.toContain("UPSTREAM_PROVIDER_SECRET_KEY");
  });
});