import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ShieldCheck,
  Terminal,
  Layers,
  CheckCircle2,
  FileText,
  Sliders,
  Activity,
  Lock,
  Cpu,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";

interface ShowcaseTab {
  id: string;
  tag: string;
  title: string;
  route: string;
  description: string;
  image: string;
  metrics: { label: string; value: string }[];
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: "dashboard",
    tag: "01 // COMMAND CENTER",
    title: "Action-Driven Readiness Workspace",
    route: "truehire.app/dashboard",
    description:
      "Your next highest-impact action, skills flagged in recent mock interviews, and active application pipeline in one view.",
    image: "/landing/dashboard-preview.png",
    metrics: [
      { label: "Next Action Engine", value: "Deterministic" },
      { label: "Skill State Sync", value: "Real-time" },
    ],
  },
  {
    id: "match",
    tag: "02 // DETERMINISTIC MATCHER",
    title: "Traceable Skill-by-Skill Scoring",
    route: "truehire.app/matches/stripe-backend",
    description:
      "Every match percentage is computed from canonical skill intersection—never an unexplained LLM guess.",
    image: "/landing/match-preview.png",
    metrics: [
      { label: "Scoring Formula", value: "|R ∩ J| / |J|" },
      { label: "Hallucinated Scores", value: "0%" },
    ],
  },
  {
    id: "gaps",
    tag: "03 // SKILL GAP REPORT",
    title: "Priority Gaps Backed by Evidence",
    route: "truehire.app/skill-gaps/cloudflare-sre",
    description:
      "Missing skills are ranked by how frequently the job posting names them and whether prior interviews flagged them weak.",
    image: "/landing/skill-gap-preview.png",
    metrics: [
      { label: "Gap Ranking", value: "High / Med / Low" },
      { label: "Interview Trigger", value: "1-Click" },
    ],
  },
  {
    id: "resume",
    tag: "04 // STRUCTURED PARSER",
    title: "Resume Parsed into Verifiable Tokens",
    route: "truehire.app/resume",
    description:
      "Upload PDF or DOCX files. TrueHire extracts normalized skills, experience duration, projects, and education.",
    image: "/landing/resume-preview.png",
    metrics: [
      { label: "Supported Formats", value: "PDF & DOCX" },
      { label: "Alias Normalization", value: "Canonical" },
    ],
  },
  {
    id: "tailoring",
    tag: "05 // EVIDENCE-BOUNDED TAILORING",
    title: "Suggestions Strictly Bounded by Your Resume",
    route: "truehire.app/tailor/vercel-frontend",
    description:
      " surfaces skills supported by your existing project descriptions that were omitted from your skills list—never inventing experience.",
    image: "/landing/tailoring-preview.png",
    metrics: [
      { label: "Fabricated Claims", value: "Blocked" },
      { label: "Candidate Control", value: "Opt-in Diff" },
    ],
  },
];

const STEPS = [
  {
    step: "01",
    title: "Match",
    body: "Upload a resume and see how it compares with a verified job, skill by skill.",
    detail:
      "Canonical alias normalization (ReactJS → react, Postgres → postgresql)",
  },
  {
    step: "02",
    title: "Prepare",
    body: "Each gap is ranked by how often the posting names it, so you know what matters most.",
    detail: "Prioritized into High, Medium, and Low urgency tiers",
  },
  {
    step: "03",
    title: "Interview",
    body: "Answer questions written for that role and your chosen skills. Each answer is scored against a rubric.",
    detail: "Customizable 15m, 30m, 45m, or 60m sessions across Easy/Med/Hard",
  },
  {
    step: "04",
    title: "Improve",
    body: "Skills your interview flagged carry into your next match and your next interview.",
    detail:
      "Closed-loop write-back updates UserSkill proficiency automatically",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Job Listing Provenance",
    generic: "Scraped aggregators, reposted ghost jobs, unknown age",
    truehire:
      "Direct official ATS sync (Greenhouse) with last-synced timestamps",
  },
  {
    feature: "Match Score Calculation",
    generic: "Opaque LLM-guessed percentage that changes on every run",
    truehire: "100% deterministic skill-set intersection you can inspect",
  },
  {
    feature: "Mock Interview Structure",
    generic: "Generic static behavioral prompts unrelated to the posting",
    truehire: "Role-specific rounds targeting your exact job skill gaps",
  },
  {
    feature: "Resume Tailoring",
    generic: "Rewrites bullets with fabricated metrics and buzzwords",
    truehire:
      "Evidence-bounded suggestions strictly backed by your resume text",
  },
  {
    feature: "Post-Interview Feedback Loop",
    generic: "Isolated chat transcript that is forgotten immediately",
    truehire: "Weaknesses update your persistent skill profile for future jobs",
  },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle interactive showcase tabs unless user hovers/interacts
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveTabIndex((prev) => (prev + 1) % SHOWCASE_TABS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const activeShowcase = SHOWCASE_TABS[activeTabIndex];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-teal-500/20 selection:text-teal-200">
      {/* Top Telemetry Strip */}
      <div className="border-b border-zinc-800/80 bg-zinc-950 px-4 py-2 text-center font-mono text-[11px] text-zinc-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-200">TRUEHIRE V1 PRODUCTION</span>
          <span className="hidden text-zinc-600 sm:inline">//</span>
          <span className="hidden sm:inline">
            Official ATS Job Ingestion · Deterministic Matching · Closed-Loop AI
            Mock Interviews
          </span>
        </span>
      </div>

      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-white"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-teal-500/40 bg-teal-500/10">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
              </span>
              <span>TrueHire</span>
            </Link>

            <nav
              aria-label="Main"
              className="hidden items-center gap-1 text-xs font-medium text-zinc-400 md:flex"
            >
              <a
                href="#product-tour"
                className="rounded-md px-3 py-1.5 transition hover:bg-zinc-900 hover:text-white"
              >
                Interactive Tour
              </a>
              <a
                href="#how-it-works"
                className="rounded-md px-3 py-1.5 transition hover:bg-zinc-900 hover:text-white"
              >
                How it works
              </a>
              <a
                href="#architecture"
                className="rounded-md px-3 py-1.5 transition hover:bg-zinc-900 hover:text-white"
              >
                Architecture
              </a>
              <a
                href="#comparison"
                className="rounded-md px-3 py-1.5 transition hover:bg-zinc-900 hover:text-white"
              >
                Why TrueHire
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                <Link
                  to="/jobs"
                  className="hidden rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:text-white sm:inline-flex"
                >
                  Browse Jobs
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98]"
                >
                  <span>
                    {user?.name
                      ? `${user.name.split(" ")[0]}'s Workspace`
                      : "Open Dashboard"}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98]"
                >
                  <span>Get started</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section with Architectural Grid & Spotlight */}
        <section className="relative overflow-hidden border-b border-zinc-800/80 pb-20 pt-16 sm:pt-24">
          {/* Background Grid & Ambient Glow */}
          <div
            aria-hidden="true"
            className="bg-architectural-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_60%,transparent_100%)]"
          />
          <div
            aria-hidden="true"
            className="animate-pulse-glow pointer-events-none absolute left-1/2 top-0 h-[340px] w-[680px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]"
          />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="landing-rise inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 font-mono text-[11px] text-zinc-300 shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                <span>VERIFIED ATS LISTINGS · RUBRIC-GRADED INTERVIEWS</span>
              </div>

              <h1
                className="landing-rise mt-6 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-[68px] lg:leading-[1.04]"
                style={{ animationDelay: "80ms" }}
              >
                From job description to{" "}
                <span className="bg-gradient-to-r from-white via-zinc-200 to-teal-400 bg-clip-text text-transparent">
                  interview-ready.
                </span>
              </h1>

              <p
                className="landing-rise mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg"
                style={{ animationDelay: "140ms" }}
              >
                TrueHire compares your resume with verified jobs, shows your
                gaps in plain terms, and runs mock interviews whose results feed
                back into your preparation.
              </p>

              <div
                className="landing-rise mt-9 flex flex-wrap items-center justify-center gap-3"
                style={{ animationDelay: "200ms" }}
              >
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-teal-500/10 transition hover:bg-teal-400 active:scale-[0.98]"
                    >
                      <span>Open Readiness Dashboard</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/jobs"
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                    >
                      <span>Explore Verified Jobs</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-teal-500/10 transition hover:bg-teal-400 active:scale-[0.98]"
                    >
                      <span>Get started free</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <a
                      href="#how-it-works"
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                    >
                      <span>See how it works</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Telemetry Strip under Hero */}
            <div
              className="landing-rise mt-14 grid grid-cols-2 divide-x divide-y divide-zinc-800/80 overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-900/40 backdrop-blur-sm sm:grid-cols-4 sm:divide-y-0"
              style={{ animationDelay: "260ms" }}
            >
              {[
                [
                  "PROVENANCE",
                  "Official Company ATS",
                  "Direct Greenhouse sync",
                ],
                [
                  "MATCH ENGINE",
                  "100% Deterministic",
                  "Zero black-box guessing",
                ],
                [
                  "MOCK SESSIONS",
                  "15m – 60m Custom",
                  "Driven by job skill gaps",
                ],
                [
                  "CLOSED LOOP",
                  "Auto-Synced Profile",
                  "Weaknesses guide next prep",
                ],
              ].map(([tag, stat, sub]) => (
                <div key={tag} className="p-4 sm:p-5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-teal-400">
                    {tag}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-white sm:text-base">
                    {stat}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Product Workspace Switcher */}
        <section
          id="product-tour"
          className="mx-auto max-w-6xl px-4 py-20 sm:px-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-400">
                Interactive System Walkthrough
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Five connected workspaces. One continuous loop.
              </h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-zinc-400">
              Select any module below to inspect how candidate data flows from
              resume parsing to interview rubric evaluation.
            </p>
          </div>

          {/* Interactive Module Selector Tabs */}
          <div className="grid gap-2 sm:grid-cols-5">
            {SHOWCASE_TABS.map((tab, idx) => {
              const active = idx === activeTabIndex;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabIndex(idx)}
                  className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-200 ${
                    active
                      ? "border-teal-500/60 bg-zinc-900/90 shadow-lg"
                      : "border-zinc-800/80 bg-zinc-900/25 hover:border-zinc-700 hover:bg-zinc-900/50"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider ${
                      active ? "text-teal-400" : "text-zinc-500"
                    }`}
                  >
                    {tab.tag}
                  </span>
                  <span
                    className={`mt-2 text-xs font-semibold leading-snug ${
                      active
                        ? "text-white"
                        : "text-zinc-300 group-hover:text-white"
                    }`}
                  >
                    {tab.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Framed Browser Preview with Animated Content */}
          <div
            key={activeShowcase.id}
            className="animate-tab-in mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-2xl"
          >
            {/* Window Chrome Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="ml-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 font-mono text-[11px] text-zinc-400">
                  https://{activeShowcase.route}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {activeShowcase.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="hidden items-center gap-1.5 font-mono text-[11px] sm:flex"
                  >
                    <span className="text-zinc-500">{m.label}:</span>
                    <span className="rounded bg-teal-500/10 px-2 py-0.5 font-semibold text-teal-300">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-12 lg:items-center lg:p-8">
              <div className="space-y-4 lg:col-span-4">
                <span className="font-mono text-xs uppercase tracking-widest text-teal-400">
                  {activeShowcase.tag}
                </span>
                <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {activeShowcase.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {activeShowcase.description}
                </p>

                <div className="space-y-2 border-t border-zinc-800/80 pt-4">
                  {activeShowcase.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-[#09090b] px-3 py-2 font-mono text-xs"
                    >
                      <span className="text-zinc-400">{m.label}</span>
                      <span className="font-semibold text-teal-300">
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    to={isAuthenticated ? "/dashboard" : "/register"}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300"
                  >
                    <span>
                      {isAuthenticated
                        ? "Open this module in your workspace"
                        : "Try this workflow with your resume"}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-8">
                <img
                  src={activeShowcase.image}
                  alt={`${activeShowcase.title}. Sample data.`}
                  width={1280}
                  height={720}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4-Step Closed Loop Section (#how-it-works) */}
        <section
          id="how-it-works"
          className="border-y border-zinc-800/80 bg-zinc-950/60 py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-400">
                  Closed-Loop Readiness Workflow
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  How TrueHire turns gaps into offers
                </h2>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-zinc-400">
                Most platforms stop after showing a job listing. TrueHire
                connects discovery, gap analysis, mock interviewing, and resume
                tailoring into a continuous feedback cycle.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <div
                  key={step.title}
                  className="group relative flex flex-col justify-between rounded-xl border border-zinc-800/90 bg-[#09090b] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-teal-500/40"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-teal-400">
                        Step {step.step}
                      </span>
                      <span className="h-2 w-2 rounded-full bg-zinc-800 transition group-hover:bg-teal-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {step.body}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-zinc-800/80 pt-3 font-mono text-[11px] text-zinc-500">
                    {step.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architectural Pillars Bento Grid (#architecture) */}
        <section
          id="architecture"
          className="mx-auto max-w-6xl px-4 py-20 sm:px-6"
        >
          <div className="mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-400">
              Engineering Standards
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Every job has a source. Every score has a trace.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            {/* Bento 1: Provenance */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 md:col-span-7">
              <div>
                <div className="inline-flex items-center gap-2 font-mono text-xs text-teal-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>OFFICIAL ATS PROVENANCE</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Every job has a source you can check
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Listings come from the company's own job board through its
                  official applicant tracking system. Each job shows where it
                  came from and when it was last synced.
                </p>
              </div>

              <div className="mt-6 rounded-lg border border-zinc-800 bg-[#09090b] p-4 font-mono text-xs">
                <div className="flex items-center justify-between text-zinc-500">
                  <span>ATS_ADAPTER // GREENHOUSE_NORMALIZER</span>
                  <span className="text-emerald-400">STATUS: ACTIVE</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Stripe",
                    "Cloudflare",
                    "Vercel",
                    "Datadog",
                    "Discord",
                    "Bengaluru Tech Hubs",
                    "Remote Global",
                  ].map((src) => (
                    <span
                      key={src}
                      className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bento 2: Deterministic Scoring */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 md:col-span-5">
              <div>
                <div className="inline-flex items-center gap-2 font-mono text-xs text-teal-400">
                  <Terminal className="h-4 w-4" />
                  <span>DETERMINISTIC SCORING</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Scores you can trace
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  A match score comes from named skills. Every gap says why it
                  matters. When a posting lists no skills we can compare,
                  TrueHire says so instead of guessing a number.
                </p>
              </div>

              <div className="mt-6 space-y-2 rounded-lg border border-zinc-800 bg-[#09090b] p-4 font-mono text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Matched (Resume ∩ Job)</span>
                  <span className="text-emerald-400">
                    [java, typescript, postgresql, docker]
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Priority Gap Flagged</span>
                  <span className="text-amber-400">[redis, system design]</span>
                </div>
                <div className="border-t border-zinc-800 pt-2 flex justify-between font-semibold text-white">
                  <span>Explainable Match Score</span>
                  <span className="text-teal-400">67% (4 of 6 verified)</span>
                </div>
              </div>
            </div>

            {/* Bento 3: Skill-Driven Interview Customizer */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 md:col-span-5">
              <div>
                <div className="inline-flex items-center gap-2 font-mono text-xs text-teal-400">
                  <Sliders className="h-4 w-4" />
                  <span>SKILL-DRIVEN MOCK INTERVIEWS</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Practice the exact skills the job demands
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Pick specific missing or matched skills from the job, choose
                  your duration (15m to 60m) and difficulty level, and receive
                  rubric-scored feedback on every answer.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {[
                  "15m / 30m / 45m / 60m",
                  "Easy · Medium · Hard",
                  "Job Skill Gaps",
                  "Custom Skill Input",
                  "Rubric Breakdown",
                ].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-md border border-zinc-800 bg-[#09090b] px-2.5 py-1 font-mono text-[11px] text-zinc-300"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Bento 4: Non-Fabricated Resume Tailoring */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 md:col-span-7">
              <div>
                <div className="inline-flex items-center gap-2 font-mono text-xs text-teal-400">
                  <Lock className="h-4 w-4" />
                  <span>ZERO-FABRICATION GUARDRAIL</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Tailoring bounded strictly by your real experience
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  TrueHire never invents projects, companies, or skills you
                  don't have. It scans your existing experience descriptions for
                  evidence of required job skills and lets you accept or reject
                  every addition.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="font-mono text-[10px] uppercase text-emerald-400">
                    Suggested to Add (Evidence Found)
                  </p>
                  <p className="mt-1 text-xs font-medium text-zinc-200">
                    REST APIs — Found in your backend project description
                  </p>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="font-mono text-[10px] uppercase text-amber-400">
                    Not on Resume (Held Back)
                  </p>
                  <p className="mt-1 text-xs font-medium text-zinc-200">
                    Kubernetes — Not in resume text; flagged as a skill gap
                    instead
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table (#comparison) */}
        <section
          id="comparison"
          className="border-t border-zinc-800/80 bg-zinc-950/40 py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-400">
                Architectural Comparison
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Why generic job boards and AI wrappers fall short
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#09090b]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 font-mono text-xs uppercase tracking-wider text-zinc-400">
                    <th className="py-4 px-5">Capability</th>
                    <th className="py-4 px-5">Generic Boards & AI Wrappers</th>
                    <th className="py-4 px-5 text-teal-400">
                      TrueHire Standard
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-xs sm:text-sm">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.feature} className="hover:bg-zinc-900/30">
                      <td className="py-4 px-5 font-medium text-zinc-200">
                        {row.feature}
                      </td>
                      <td className="py-4 px-5 text-zinc-500">{row.generic}</td>
                      <td className="py-4 px-5 font-medium text-zinc-100">
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
                          <span>{row.truehire}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-[#09090b] to-teal-950/30 p-8 sm:p-12">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-widest text-teal-400">
                Ready to Benchmark Your Readiness?
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
                Upload your resume once. Test yourself against verified
                engineering roles.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Inspect your exact skill overlap, practice targeted mock
                interviews for your weak spots, and track every application in
                one workspace.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400"
                    >
                      <span>Return to Dashboard</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/jobs"
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 text-xs font-semibold text-white transition hover:bg-zinc-800"
                    >
                      <span>Browse Verified Jobs</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400"
                    >
                      <span>Create Free Account</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 text-xs font-semibold text-white transition hover:bg-zinc-800"
                    >
                      <span>Sign in to Existing Account</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Complete Multi-Column SaaS Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#070709] pt-14 pb-10 text-xs text-zinc-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-5">
            {/* Col 1-2: Brand & System Status */}
            <div className="space-y-4 lg:col-span-2">
              <Link
                to="/"
                className="flex items-center gap-2 text-sm font-semibold text-white"
              >
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span>TrueHire</span>
              </Link>
              <p className="max-w-xs text-xs leading-relaxed text-zinc-400">
                Verified job discovery, deterministic resume-to-job matching,
                and closed-loop AI interview readiness platform.
              </p>
              <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 font-mono text-[11px] text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>All systems operational · ATS & AI Ready</span>
              </div>
            </div>

            {/* Col 3: Workspace */}
            <div className="space-y-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-200">
                Workspace
              </p>
              <ul className="space-y-2">
                <li>
                  <Link to="/dashboard" className="hover:text-white">
                    Readiness Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/jobs" className="hover:text-white">
                    Verified Job Board
                  </Link>
                </li>
                <li>
                  <Link to="/saved-jobs" className="hover:text-white">
                    Saved Roles
                  </Link>
                </li>
                <li>
                  <Link to="/applications" className="hover:text-white">
                    Application Tracker
                  </Link>
                </li>
                <li>
                  <Link to="/resume" className="hover:text-white">
                    Resume Manager
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Platform Architecture */}
            <div className="space-y-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-200">
                Architecture
              </p>
              <ul className="space-y-2">
                <li>
                  <a href="#product-tour" className="hover:text-white">
                    Interactive Tour
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white">
                    4-Stage Closed Loop
                  </a>
                </li>
                <li>
                  <a href="#architecture" className="hover:text-white">
                    Deterministic Matcher
                  </a>
                </li>
                <li>
                  <a href="#comparison" className="hover:text-white">
                    Zero-Fabrication Guardrails
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 5: Account */}
            <div className="space-y-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-200">
                Candidate Access
              </p>
              <ul className="space-y-2">
                {isAuthenticated ? (
                  <>
                    <li>
                      <Link to="/profile" className="hover:text-white">
                        Candidate Profile
                      </Link>
                    </li>
                    <li>
                      <Link to="/onboarding" className="hover:text-white">
                        Preferences Wizard
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link to="/login" className="hover:text-white">
                        Sign In
                      </Link>
                    </li>
                    <li>
                      <Link to="/register" className="hover:text-white">
                        Create Account
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-800/80 pt-6 font-mono text-[11px] text-zinc-500 sm:flex-row">
            <p>
              © {new Date().getFullYear()} TrueHire. Built for verifiable career
              readiness.
            </p>
            <p>REACT · TYPESCRIPT · EXPRESS · PRISMA · POSTGRESQL</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
