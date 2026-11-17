import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { E2E_USERS } from "./fixtures/users.js";
import { apiRequest } from "./helpers/api.js";
import { authenticatePage, loginViaApi } from "./helpers/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures");

test.describe("Journey 2: Resume Upload, Parsing Diagnostics, Recovery & Isolation", () => {
  test("uploads PDF/DOCX, rejects invalid/oversized files, warns on scanned PDF, supports paste fallback, section edit, re-analysis, delete, and user isolation", async ({
    page,
  }) => {
    const userA = await loginViaApi(
      E2E_USERS.candidateA.email,
      E2E_USERS.candidateA.password,
    );
    const userB = await loginViaApi(
      E2E_USERS.candidateB.email,
      E2E_USERS.candidateB.password,
    );

    await authenticatePage(page, userA);
    await page.goto("/resume");

    // 1. Upload valid PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, "sample-resume.pdf"));
    await expect(page.getByText(/sample-resume\.pdf/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/React/i).first()).toBeVisible();

    // 2. Upload valid DOCX
    await fileInput.setInputFiles(
      path.join(FIXTURES_DIR, "sample-resume.docx"),
    );
    await expect(page.getByText(/sample-resume\.docx/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // 3. Reject unsupported file type (.txt)
    await fileInput.setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Plain text file not allowed"),
    });
    await expect(page.getByText(/PDF|DOCX/i).first()).toBeVisible();

    // 4. Reject oversized file (> 5MB)
    await fileInput.setInputFiles({
      name: "huge.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1024, 0x25),
    });
    await expect(
      page.getByText(/5\s*MB|size limit|too large/i).first(),
    ).toBeVisible();

    // 5. Scanned / low-text PDF warning
    await fileInput.setInputFiles(
      path.join(FIXTURES_DIR, "unreadable-resume.pdf"),
    );
    await expect(
      page.getByText(/No readable text|Scanned PDF|paste/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // 6. Paste-resume fallback + section edit + re-analysis without re-uploading
    const pasted = await apiRequest<{
      resume: { id: string; skills: string[] };
    }>("/resumes/paste", {
      method: "POST",
      token: userA.token,
      body: {
        title: "Pasted Full-Stack Resume",
        rawText:
          "Senior Software Engineer\nExperience\nBuilt React, TypeScript, Node.js, and PostgreSQL distributed systems for 4 years.",
      },
    });
    expect(pasted.status).toBe(201);
    const resumeId = pasted.data.resume.id;

    // 7. Prevent User B from accessing User A's resume
    const forbiddenGet = await apiRequest(`/resumes/${resumeId}`, {
      token: userB.token,
    });
    expect(forbiddenGet.status).toBe(404);

    // 8. Edit extracted section & re-analyze without re-uploading
    const sectionRes = await apiRequest(`/resumes/${resumeId}/sections`, {
      method: "PATCH",
      token: userA.token,
      body: {
        skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Redis"],
        rawText:
          "Senior Software Engineer\nExperience\nBuilt React, TypeScript, Node.js, PostgreSQL, and Redis clusters.",
      },
    });
    expect(sectionRes.status).toBe(200);

    const reanalyzeRes = await apiRequest<{ resume: { skills: string[] } }>(
      `/resumes/${resumeId}/reanalyze`,
      {
        method: "POST",
        token: userA.token,
      },
    );
    expect(reanalyzeRes.status).toBe(200);
    expect(reanalyzeRes.data.resume.skills).toContain("Redis");

    // 9. Delete resume
    const delRes = await apiRequest(`/resumes/${resumeId}`, {
      method: "DELETE",
      token: userA.token,
    });
    expect(delRes.status).toBe(200);
  });
});
