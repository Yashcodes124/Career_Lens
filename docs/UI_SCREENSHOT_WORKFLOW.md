# UI Screenshot Review Workflow

Use this procedure to quickly capture, organize, and review the UI of a web application without manually navigating every page.

It is useful for:

- Reviewing your own project before sharing it.
- Identifying UI inconsistencies.
- Checking responsive layouts.
- Creating portfolio screenshots.
- Comparing UI before and after a redesign.
- Creating visual documentation for a README or case study.
- Capturing empty, loading, error, and populated states.

---

## 1. Prepare the app

Start both the frontend and backend.

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
cd client
npm run dev
```

Confirm the app is running:

```text
http://localhost:5173
```

If your frontend uses a different port, replace `5173` with your actual port.

---

## 2. Create a screenshots folder

At the project root:

```bash
mkdir ui-screenshots
```

Recommended structure:

```text
ui-screenshots/
├── 01-landing.png
├── 02-login.png
├── 03-register.png
├── 04-onboarding.png
├── 05-dashboard.png
├── 06-feature-page.png
├── 07-detail-page.png
├── 08-empty-state.png
├── 09-loading-state.png
├── 10-error-state.png
├── 11-mobile-dashboard.png
└── 12-mobile-feature-page.png
```

Use numbered names so screenshots appear in a logical order.

---

## 3. Install Playwright

Install Playwright only when you need automated screenshots.

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Add this to `.gitignore`:

```gitignore
ui-screenshots/
test-results/
playwright-report/
```

Do not commit screenshots if they contain real user data, private API responses, or confidential business information.

---

## 4. Create the screenshot script

Create:

```text
scripts/capture-ui.mjs
```

Paste this reusable script:

```js
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

const publicPages = [
  { name: "01-landing", path: "/" },
  { name: "02-login", path: "/login" },
  { name: "03-register", path: "/register" },
];

const protectedPages = [
  { name: "05-dashboard", path: "/dashboard" },
  { name: "06-jobs", path: "/jobs" },
  { name: "07-resumes", path: "/resumes" },
  { name: "08-skill-gaps", path: "/skill-gaps" },
  { name: "09-applications", path: "/applications" },
  { name: "10-readiness", path: "/readiness" },
];

fs.mkdirSync("ui-screenshots", { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

const page = await context.newPage();

async function capture({ name, path }) {
  await page.goto(`${BASE_URL}${path}`, {
    waitUntil: "networkidle",
  });

  await page.waitForTimeout(750);

  await page.screenshot({
    path: `ui-screenshots/${name}.png`,
    fullPage: true,
  });

  console.log(`Captured: ${name}`);
}

// Public pages
for (const target of publicPages) {
  await capture(target);
}

// Login only if credentials are provided
if (EMAIL && PASSWORD) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);

  await page.getByRole("button", { name: /log in|sign in/i }).click();

  await page.waitForURL(/dashboard|\/$/i, { timeout: 15000 });

  for (const target of protectedPages) {
    await capture(target);
  }
}

await browser.close();
```

Update the `path` values to match your actual React Router routes.

---

## 5. Run the script

For public pages only:

```bash
BASE_URL=http://localhost:5173 node scripts/capture-ui.mjs
```

For public and authenticated pages:

```bash
BASE_URL=http://localhost:5173 \
TEST_EMAIL=demo@example.com \
TEST_PASSWORD=DemoPassword@123 \
node scripts/capture-ui.mjs
```

Use a test account, not your personal account.

---

## 6. Capture important UI states

Do not capture only the happy path. Capture the states users actually encounter.

| State           | Why capture it                   | Example                    |
| --------------- | -------------------------------- | -------------------------- |
| Empty state     | Shows first-time user experience | “No resumes uploaded yet”  |
| Loading state   | Shows perceived performance      | Skeleton cards             |
| Error state     | Shows failure handling           | Failed resume upload       |
| Success state   | Shows completed workflow         | Resume parsed successfully |
| Desktop view    | Shows primary layout             | 1440px width               |
| Tablet view     | Shows responsive behavior        | 768px width                |
| Mobile view     | Shows real-world usability       | 390px width                |
| Modal or drawer | Shows focused interactions       | Job details drawer         |
| Form validation | Shows input quality              | Invalid email or password  |

For mobile screenshots, create a separate context:

```js
const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
});

const mobilePage = await mobileContext.newPage();

await mobilePage.goto(`${BASE_URL}/dashboard`);
await mobilePage.screenshot({
  path: "ui-screenshots/11-mobile-dashboard.png",
  fullPage: true,
});
```

---

## 7. Review the screenshots

For every screenshot, check:

- Is the primary action obvious?
- Is the page title clear?
- Is there enough whitespace?
- Are headings, body text, and secondary text visually distinct?
- Are buttons consistent?
- Are cards aligned correctly?
- Are empty states helpful?
- Are loading states visible?
- Are error messages understandable?
- Does the page work on mobile?
- Is any sensitive data visible?
- Does the page look like a real product or a generic template?

Create a simple review note:

```md
## Dashboard review

### What works

- Clear readiness score
- Clear primary CTA
- Good use of cards

### What needs improvement

- Too many empty metric cards
- No clear “next best action”
- Skill gaps are not prioritized
- Buttons have inconsistent spacing

### Changes

- Add a prominent next-action card
- Reduce metric cards from six to three
- Add priority labels to skill gaps
- Standardize button spacing
```

---

## 8. Export only the best screenshots

For a README, portfolio, LinkedIn post, or DEV article, use only high-quality screenshots.

Recommended export size:

```text
Desktop: 1440 × 900 or full-page screenshot
Mobile: 390 × 844
```

Use PNG for UI screenshots because it preserves text clarity.

Avoid uploading screenshots that contain:

- Real email addresses
- API keys
- Database credentials
- JWT tokens
- Private company data
- Personal information
- Console errors with sensitive paths

---

## 9. Add screenshots to README

```md
## Screenshots

| Dashboard | Job Matching |
| --------- | ------------ |
|           |              |

| Skill Gaps | Interview Evaluation |
| ---------- | -------------------- |
|            |                      |
```

---

## 10. Optional: automate visual regression

For long-term projects, add screenshot tests to catch unintended UI changes.

```js
import { test, expect } from "@playwright/test";

test("dashboard matches approved screenshot", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveScreenshot("dashboard.png", {
    fullPage: true,
  });
});
```

Playwright provides screenshot assertions that compare a captured page against an expected snapshot. [7]

---

## Checklist

Before sharing a project publicly:

- [ ] Backend and frontend are running.
- [ ] Test account is used.
- [ ] Screenshots are saved in `ui-screenshots/`.
- [ ] Desktop and mobile views are captured.
- [ ] Empty, loading, and error states are captured.
- [ ] No secrets or private data are visible.
- [ ] Screenshots are reviewed before publishing.
- [ ] Best screenshots are added to the README.
- [ ] Screenshots folder is ignored in Git if it contains sensitive data.
