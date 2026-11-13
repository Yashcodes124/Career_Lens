import { test, expect } from "@playwright/test";

test.describe("TrueHire Critical User Flows", () => {
  test("renders Landing Page and navigates to Login and Register", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/TrueHire/i);

    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.goto("/register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("authenticates user and loads protected Dashboard, Resume, Match, and Interview routes", async ({
    page,
  }) => {
    const fakeUser = {
      id: "user-e2e-1",
      email: "engineer@truehire.dev",
      name: "Aarav Sharma",
      role: "USER",
      targetRole: "Full Stack Engineer",
      preferredLocations: ["Bengaluru"],
      experienceLevel: "Mid-Level",
    };

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({ status: 200, json: fakeUser });
    });

    await page.route("**/api/resumes", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          resumes: [
            {
              id: "resume-1",
              title: "Aarav_Sharma_Resume.pdf",
              fileName: "Aarav_Sharma_Resume.pdf",
              skills: ["typescript", "react", "node.js", "postgresql"],
              experienceYrs: 3,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
    });

    await page.route("**/api/readiness", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            skills: [
              {
                skill: "typescript",
                status: "STRONG",
                evidence: "Scored 88/100 in mock interview",
                updatedAt: new Date().toISOString(),
              },
            ],
            nextAction: {
              type: "EXPLORE_JOBS",
              reason: "Explore matched software engineering roles",
            },
          },
        },
      });
    });

    await page.route("**/api/jobs**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          jobs: [
            {
              id: "job-razorpay-1",
              title: "Software Development Engineer II",
              company: "Razorpay",
              location: "Bengaluru, India",
              source: "GREENHOUSE",
              description:
                "Build high-throughput payment services in Go and TypeScript.",
              requirements: ["typescript", "node.js", "postgresql", "docker"],
              isActive: true,
            },
          ],
          total: 1,
          page: 1,
          pageSize: 50,
        },
      });
    });

    await page.route("**/api/applications**", async (route) => {
      await route.fulfill({
        status: 200,
        json: { success: true, applications: [] },
      });
    });

    await page.route("**/api/interviews**", async (route) => {
      await route.fulfill({
        status: 200,
        json: { success: true, data: [] },
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem("truehire_auth_token", "e2e-valid-jwt-token");
    });

    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(
      /Aarav|Dashboard|Readiness/i,
    );

    await page.goto("/resume");
    await expect(page.locator("body")).toContainText(
      /Aarav_Sharma_Resume\.pdf/i,
    );

    await page.goto("/jobs");
    await expect(page.locator("body")).toContainText(/Razorpay/i);

    await page.goto("/interviews");
    await expect(page.locator("body")).toContainText(/Interview/i);
  });
});
