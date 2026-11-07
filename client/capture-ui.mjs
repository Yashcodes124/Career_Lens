import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const API_URL = process.env.API_URL || "http://localhost:5000/api";

const EMAIL = process.env.TEST_EMAIL || "demo@truehire.dev";
const PASSWORD = process.env.TEST_PASSWORD || "DemoPassword@123";
const ENV_INTERVIEW_ID = process.env.TEST_INTERVIEW_ID || null;
const ENV_JOB_ID = process.env.TEST_JOB_ID || null;

const OUT_DIR = path.resolve(process.cwd(), "ui-screenshots");

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

function extractToken(data, setCookieHeader) {
  const bodyToken =
    data?.token ||
    data?.accessToken ||
    data?.data?.token ||
    data?.data?.accessToken ||
    null;

  if (bodyToken) return bodyToken;

  if (setCookieHeader) {
    const match = setCookieHeader.match(/(?:token|jwt|auth_token)=([^;]+)/i);
    if (match?.[1]) return match[1];
  }

  return null;
}

function extractList(data, keys) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    const value = data?.[key];
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
  }
  return [];
}

async function requestJson(urlPath, options = {}) {
  try {
    const response = await fetch(`${API_URL}${urlPath}`, options);
    const text = await response.text();
    const setCookie = response.headers.get("set-cookie");

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
      setCookie,
    };
  } catch (err) {
    console.error(`Request failed for ${API_URL}${urlPath}: ${err.message}`);
    return { ok: false, status: 0, data: null, setCookie: null };
  }
}

async function getAuthTokenAndSampleData() {
  let token = null;
  let rawCookie = null;

  const login = await requestJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (login.ok) {
    token = extractToken(login.data, login.setCookie);
    rawCookie = login.setCookie;
  } else {
    console.warn(
      `Login (${EMAIL}) returned HTTP ${login.status}:`,
      login.data?.message || login.data?.error || "Trying register fallback...",
    );
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
      token = extractToken(register.data, register.setCookie);
      rawCookie = register.setCookie;
    } else {
      console.warn(
        `Register fallback returned HTTP ${register.status}:`,
        register.data?.message || register.data?.error || "",
      );
    }
  }

  const authHeaders = {};
  if (token) authHeaders.Authorization = `Bearer ${token}`;
  if (rawCookie) authHeaders.Cookie = rawCookie.split(";")[0];

  let sampleJobId = ENV_JOB_ID;
  let sampleResumeId = null;
  let sampleApplicationId = null;
  let sampleInterviewId = ENV_INTERVIEW_ID;

  if (token || rawCookie) {
    const jobs = await requestJson("/jobs?pageSize=5", {
      headers: authHeaders,
    });
    const jobList = extractList(jobs.data, ["jobs", "data", "items"]);
    if (!sampleJobId) {
      sampleJobId = jobList?.[0]?.id ?? null;
    }

    const resumes = await requestJson("/resumes", { headers: authHeaders });
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

    if (!sampleInterviewId) {
      const interviews = await requestJson("/interviews", {
        headers: authHeaders,
      });
      const interviewList = extractList(interviews.data, [
        "interviews",
        "data",
        "items",
      ]);
      sampleInterviewId = interviewList?.[0]?.id ?? null;
    }
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
  context,
  pageRef,
  name,
  routePath,
  viewportLabel,
  waitSelector = null,
}) {
  const fileName = `${name}-${viewportLabel}.png`;
  const filePath = path.join(OUT_DIR, fileName);

  // If previous route crashed the page, open a fresh one
  if (pageRef.current.isClosed()) {
    pageRef.current = await context.newPage();
  }
  const page = pageRef.current;

  try {
    await page.goto(`${BASE_URL}${routePath}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page
      .waitForLoadState("networkidle", { timeout: 8000 })
      .catch(() => {});

    if (waitSelector) {
      await page
        .locator(waitSelector)
        .first()
        .waitFor({ state: "visible", timeout: 8000 })
        .catch(() => {});
    }

    await page.waitForTimeout(1000);

    await page.screenshot({
      path: filePath,
      fullPage: true,
      animations: "disabled",
    });

    console.log(`Captured: ${fileName} (${routePath})`);
  } catch (error) {
    console.warn(`Failed to capture ${fileName}: ${error.message}`);
  }
}

const { token, sampleJobId, sampleResumeId, sampleInterviewId } =
  await getAuthTokenAndSampleData();

console.log("Session Status:", {
  authenticated: Boolean(token),
  sampleJobId,
  sampleResumeId,
  sampleInterviewId,
});

const jobQuery = sampleResumeId ? `?resumeId=${sampleResumeId}` : "";

const publicRoutes = [
  { name: "01-landing", path: "/", waitSelector: "main, header, section, h1" },
  { name: "02-login", path: "/login", waitSelector: "form, input, button" },
  {
    name: "03-register",
    path: "/register",
    waitSelector: "form, input, button",
  },
  {
    name: "04-not-found",
    path: "/this-page-does-not-exist",
    waitSelector: "h1",
  },
];

const protectedRoutes = [
  { name: "05-dashboard", path: "/dashboard", waitSelector: "main, h1, h2" },
  { name: "06-profile", path: "/profile", waitSelector: "main, h1, h2, form" },
  { name: "07-resume", path: "/resume", waitSelector: "main, h1, h2" },
  { name: "08-jobs", path: "/jobs", waitSelector: "main, h1, h2" },
  { name: "09-saved-jobs", path: "/saved-jobs", waitSelector: "main, h1, h2" },
  {
    name: "10-applications",
    path: "/applications",
    waitSelector: "main, h1, h2",
  },
  { name: "11-readiness", path: "/readiness", waitSelector: "main, h1, h2" },
  { name: "12-skills", path: "/skills", waitSelector: "main, h1, h2" },
];

const jobDependentRoutes = sampleJobId
  ? [
      {
        name: "13-match",
        path: `/matches/${sampleJobId}${jobQuery}`,
        waitSelector: "main, h1, h2",
      },
      {
        name: "14-skill-gap",
        path: `/skill-gap/${sampleJobId}${jobQuery}`,
        waitSelector: "main, h1, h2",
      },
      {
        name: "15-skill-gaps",
        path: `/skill-gaps/${sampleJobId}${jobQuery}`,
        waitSelector: "main, h1, h2",
      },
      {
        name: "16-tailor",
        path: `/tailor/${sampleJobId}${jobQuery}`,
        waitSelector: "main, h1, h2",
      },
    ]
  : [];

const interviewRoutes = sampleInterviewId
  ? [
      {
        name: "17-interview-prep",
        path: `/interviews/${sampleInterviewId}/prep`,
        waitSelector: "main, h1, h2",
      },
      {
        name: "18-interview-live",
        path: `/interviews/${sampleInterviewId}/live`,
        waitSelector: "main, h1, h2",
      },
      {
        name: "19-interview-evaluation",
        path: `/interviews/${sampleInterviewId}/evaluation`,
        waitSelector: "main, h1, h2",
      },
    ]
  : [];

const viewports = [
  { label: "desktop", width: 1440, height: 900 },
  { label: "mobile", width: 390, height: 844 },
];

// Disable GPU and shared memory issues on Windows + Node 22
const browser = await chromium.launch({
  headless: true,
  args: [
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--disable-setuid-sandbox",
  ],
});

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });

  const pageRef = { current: await context.newPage() };

  for (const route of publicRoutes) {
    await capturePage({
      context,
      pageRef,
      name: route.name,
      routePath: route.path,
      viewportLabel: viewport.label,
      waitSelector: route.waitSelector,
    });
  }

  // Authenticate in browser via UI login or token injection
  if (token) {
    await pageRef.current.goto(`${BASE_URL}/login`, {
      waitUntil: "domcontentloaded",
    });
    await pageRef.current.evaluate(
      ([t]) => {
        window.localStorage.setItem("truehire_auth_token", t);
        window.localStorage.setItem("token", t);
        window.localStorage.setItem("auth_token", t);
      },
      [token],
    );
  } else {
    // Fallback: log in directly through the UI form
    try {
      await pageRef.current.goto(`${BASE_URL}/login`, {
        waitUntil: "domcontentloaded",
      });
      await pageRef.current.fill('input[type="email"]', EMAIL);
      await pageRef.current.fill('input[type="password"]', PASSWORD);
      await pageRef.current.click('button[type="submit"]');
      await pageRef.current.waitForTimeout(2000);
    } catch {
      // Ignore UI login fallback error
    }
  }

  const allProtectedRoutes = [
    ...protectedRoutes,
    ...jobDependentRoutes,
    ...interviewRoutes,
  ];

  for (const route of allProtectedRoutes) {
    await capturePage({
      context,
      pageRef,
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
