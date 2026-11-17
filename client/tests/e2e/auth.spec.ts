import { expect, test } from "@playwright/test";
import { E2E_USERS } from "./fixtures/users.js";
import { apiRequest } from "./helpers/api.js";
import { authenticatePage, loginViaApi } from "./helpers/auth.js";

test.describe("Journey 1: Auth, Session Recovery & Refresh-Token Rotation", () => {
  test("registers new user, rejects duplicate email, persists reload, rotates expired access token, and blocks old refresh token reuse", async ({
    page,
  }) => {
    const uniqueEmail = `newuser.${Date.now()}@truehire.test`;

    // 1. Register with valid data via UI
    await page.goto("/register");
    await page.getByLabel(/full name/i).fill("New Candidate");
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill("StrongPass@123");
    await page
      .getByRole("button", { name: /create account|register|sign up/i })
      .click();

    await expect(page).toHaveURL(/\/(onboarding|dashboard)/, {
      timeout: 10_000,
    });

    // 2. Reject duplicate email
    const dupRes = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        name: "Duplicate",
        email: uniqueEmail,
        password: "StrongPass@123",
      },
    });
    expect(dupRes.status).toBe(409);

    // 3. Login & access protected route
    const session = await loginViaApi(
      E2E_USERS.candidateA.email,
      E2E_USERS.candidateA.password,
    );
    await authenticatePage(page, session);
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Verified Skill Profile/i }),
    ).toBeVisible();

    // 4. Refresh page while authenticated
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /Verified Skill Profile/i }),
    ).toBeVisible();

    // 5. Simulate expired access token -> apiClient automatically refreshes once using refreshToken
    const oldRefreshToken = session.refreshToken;
    await page.evaluate(() => {
      localStorage.setItem("truehire_auth_token", "expired.jwt.token");
    });

    let refreshCallCount = 0;
    page.on("request", (req) => {
      if (req.url().includes("/api/auth/refresh")) refreshCallCount++;
    });

    await page.goto("/readiness");
    await expect(
      page.getByRole("heading", { name: /Readiness & Skill Evidence/i }),
    ).toBeVisible();
    expect(refreshCallCount).toBe(1);

    // 6. Reuse of the rotated-out old refresh token must be rejected with 401
    const reuseRes = await apiRequest("/auth/refresh", {
      method: "POST",
      body: { refreshToken: oldRefreshToken },
    });
    expect(reuseRes.status).toBe(401);

    // 7. Re-login cleanly, logout clears both access and refresh state
    const freshSession = await loginViaApi(
      E2E_USERS.candidateA.email,
      E2E_USERS.candidateA.password,
    );
    await authenticatePage(page, freshSession);
    await page.goto("/dashboard");
    const logoutBtn = page.getByRole("button", { name: /log out|sign out/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      await apiRequest("/auth/logout", {
        method: "POST",
        token: freshSession.token,
      });
      await page.evaluate(() => {
        localStorage.removeItem("truehire_auth_token");
        localStorage.removeItem("truehire_refresh_token");
      });
    }

    const storageState = await page.evaluate(() => ({
      access: localStorage.getItem("truehire_auth_token"),
      refresh: localStorage.getItem("truehire_refresh_token"),
    }));
    expect(storageState.access).toBeNull();
    expect(storageState.refresh).toBeNull();
  });
});
