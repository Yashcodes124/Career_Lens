import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const API_URL = process.env.API_URL || "http://localhost:5000/api";

const EMAIL = process.env.TEST_EMAIL || "demo@truehire.dev";
const PASSWORD = process.env.TEST_PASSWORD || "DemoPassword@123";

const AUTH_TOKEN_KEY = "truehire_auth_token";
const OUT_DIR = path.resolve(process.cwd(), "ui-screenshots");

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extractToken(data) {
  return (
    data?.token ||
    data?.accessToken ||
    data?.data?.token ||
    data?.data?.accessToken ||
    null
  );
}

function extractList(data, keys) {
  for (const key of keys) {
    const value = data?.[key];

    if (Array.isArray(value)) {
      return value;
    }

    if (Array.isArray(value?.data)) {
      return value.data;
    }

    if (Array.isArray(value?.items)) {
      return value.items;
    }
  }

  return [];
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function getAuthTokenAndSampleData() {
  let token = null;

  const login = await requestJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (login.ok) {
    token = extractToken(login.data);
  }

  if (!token) {
    const register = await requestJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Yash Demo",
        email: EMAIL,
        password: PASSWORD,
      }),
    });

    if (register.ok) {
      token = extractToken(register.data);
    }
  }

  if (!token) {
    return {
      token: null,
      sampleJobId: null,
      sampleResumeId: null,
      sampleApplicationId: null,
      sampleInterviewId: null,
    };
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  let sampleJobId = null;
  let sampleResumeId = null;
  let sampleApplicationId = null;
  let sampleInterviewId = null;

  const jobs = await requestJson("/jobs?pageSize=5", {
    headers: authHeaders,
  });

  const jobList = extractList(jobs.data, ["jobs", "data", "items"]);

  sampleJobId = jobList?.[0]?.id ?? null;

  const resumes = await requestJson("/resumes", {
    headers: authHeaders,
  });

  const resumeList = extractList(resumes.data, ["resumes", "data", "items"]);

  sampleResumeId = resumeList?.[0]?.id ?? null;

  const applications = await requestJson("/applications", {
    headers: authHeaders,
  });

  const applicationList = extractList(applications.data, [
    "applications",
    "data",
    "items",
  ]);

  sampleApplicationId = applicationList?.[0]?.id ?? null;

  if (!sampleApplicationId && sampleJobId) {
    const createdApplication = await requestJson("/applications", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobId: sampleJobId,
        status: "SAVED",
      }),
    });

    sampleApplicationId =
      createdApplication.data?.id || createdApplication.data?.data?.id || null;
  }

  if (sampleApplicationId) {
    const createdInterview = await requestJson("/interviews", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        applicationId: sampleApplicationId,
        durationMinutes: 15,
        difficulty: "MEDIUM",
        focusTopics: [],
      }),
    });

    sampleInterviewId =
      createdInterview.data?.id ||
      createdInterview.data?.data?.id ||
      createdInterview.data?.interview?.id ||
      createdInterview.data?.data?.interview?.id ||
      null;
  }

  return {
    token,
    sampleJobId,
    sampleResumeId,
    sampleApplicationId,
    sampleInterviewId,
  };
}

async function capturePage({
  page,
  name,
  routePath,
  viewportLabel,
  waitSelector = null,
}) {
  const fileName = `${name}-${viewportLabel}.png`;
  const filePath = path.join(OUT_DIR, fileName);

  try {
    await page.goto(`${BASE_URL}${routePath}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page
      .waitForLoadState("load", {
        timeout: 15000,
      })
      .catch(() => {});

    if (waitSelector) {
      await page
        .locator(waitSelector)
        .first()
        .waitFor({
          state: "visible",
          timeout: 10000,
        })
        .catch(() => {});
    }

    await page.waitForTimeout(1200);

    await page.screenshot({
      path: filePath,
      fullPage: true,
      animations: "disabled",
    });

    console.log(`Captured: ${fileName}`);
  } catch (error) {
    console.warn(`Failed to capture ${fileName}: ${error.message}`);

    try {
      await page.screenshot({
        path: filePath.replace(".png", "-failed.png"),
        fullPage: true,
        animations: "disabled",
      });
    } catch {
      // Ignore secondary screenshot failure.
    }
  }
}

const {
  token,
  sampleJobId,
  sampleResumeId,
  sampleApplicationId,
  sampleInterviewId,
} = await getAuthTokenAndSampleData();

if (!token) {
  console.warn(
    "No auth token obtained. Protected pages may redirect to /login.",
  );
}

if (!sampleJobId) {
  console.warn("No job ID found. Job-dependent pages will be skipped.");
}

if (!sampleInterviewId) {
  console.warn("No interview ID created. Interview pages will be skipped.");
}

const jobQuery = sampleResumeId ? `?resumeId=${sampleResumeId}` : "";

const publicRoutes = [
  {
    name: "01-landing",
    path: "/",
    waitSelector: "main, header, section, h1",
  },
  {
    name: "02-login",
    path: "/login",
    waitSelector: "form, input, button",
  },
  {
    name: "03-register",
    path: "/register",
    waitSelector: "form, input, button",
  },
  {
    name: "04-not-found",
    path: "/this-page-does-not-exist",
    waitSelector: "main, h1, h2",
  },
];

const protectedRoutes = [
  {
    name: "05-dashboard",
    path: "/dashboard",
    waitSelector: "main, h1, h2, card, section",
  },
  {
    name: "06-profile",
    path: "/profile",
    waitSelector: "main, h1, h2, form, card",
  },
  {
    name: "07-resume",
    path: "/resume",
    waitSelector: "main, h1, h2, button, card",
  },
  {
    name: "08-jobs",
    path: "/jobs",
    waitSelector: "main, h1, h2, input, button, card",
  },
  {
    name: "09-saved-jobs",
    path: "/saved-jobs",
    waitSelector: "main, h1, h2, button, card",
  },
  {
    name: "10-applications",
    path: "/applications",
    waitSelector: "main, h1, h2, button, card",
  },
  {
    name: "11-readiness",
    path: "/readiness",
    waitSelector: "main, h1, h2, button, card",
  },
  {
    name: "12-skills",
    path: "/skills",
    waitSelector: "main, h1, h2, button, card",
  },
];

const jobDependentRoutes = sampleJobId
  ? [
      {
        name: "13-match",
        path: `/matches/${sampleJobId}${jobQuery}`,
        waitSelector: "main, h1, h2, button, card",
      },
      {
        name: "14-skill-gap",
        path: `/skill-gap/${sampleJobId}${jobQuery}`,
        waitSelector: "main, h1, h2, button, card",
      },
      {
        name: "15-skill-gaps",
        path: `/skill-gaps/${sampleJobId}${jobQuery}`,
        waitSelector: "main, h1, h2, button, card",
      },
      {
        name: "16-tailor",
        path: `/tailor/${sampleJobId}${jobQuery}`,
        waitSelector: "main, h1, h2, button, textarea, card",
      },
    ]
  : [];

const interviewRoutes = sampleInterviewId
  ? [
      {
        name: "17-interview-prep",
        path: `/interviews/${sampleInterviewId}/prep`,
        waitSelector: "main, h1, h2, button, card",
      },
      {
        name: "18-interview-live",
        path: `/interviews/${sampleInterviewId}/live`,
        waitSelector: "main, h1, h2, textarea, button, card",
      },
      {
        name: "19-interview-evaluation",
        path: `/interviews/${sampleInterviewId}/evaluation`,
        waitSelector: "main, h1, h2, button, card",
      },
    ]
  : [];

const viewports = [
  {
    label: "desktop",
    width: 1440,
    height: 900,
  },
  {
    label: "mobile",
    width: 390,
    height: 844,
  },
];

const browser = await chromium.launch();

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: {
      width: viewport.width,
      height: viewport.height,
    },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  for (const route of publicRoutes) {
    await capturePage({
      page,
      name: route.name,
      routePath: route.path,
      viewportLabel: viewport.label,
      waitSelector: route.waitSelector,
    });
  }

  if (token) {
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(
      ([key, value]) => {
        window.localStorage.setItem(key, value);
      },
      [AUTH_TOKEN_KEY, token],
    );
  }

  const allProtectedRoutes = [
    ...protectedRoutes,
    ...jobDependentRoutes,
    ...interviewRoutes,
  ];

  for (const route of allProtectedRoutes) {
    await capturePage({
      page,
      name: route.name,
      routePath: route.path,
      viewportLabel: viewport.label,
      waitSelector: route.waitSelector,
    });
  }

  await context.close();
}

await browser.close();

console.log(`\nAll screenshots saved to: ${OUT_DIR}`);
console.log(
  "Upload the screenshots or ZIP file here for a detailed UI review.",
);
