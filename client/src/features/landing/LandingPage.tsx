import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Briefcase,
  Target,
  MessageSquare,
  Award,
  Layers,
  ShieldCheck,
  Database,
  Code2,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";

interface PreviewStage {
  id: string;
  step: string;
  title: string;
  summary: string;
  image: string;
  highlights: string[];
}

const PREVIEW_STAGES: PreviewStage[] = [
  {
    id: "match",
    step: "Step 1 · Requirement Coverage",
    title: "See which job requirements you already meet",
    summary:
      "Compare your extracted resume skills against real engineering job requirements with clear, explainable coverage.",
    image: "/landing/match-preview.png",
    highlights: [
      "You meet 8 of 12 requirements for this role",
      "Every matched and missing skill is listed explicitly",
      "Priority ranking based on how often skills appear in the posting",
    ],
  },
  {
    id: "gaps",
    step: "Step 2 · Skill Gap Plan",
    title: "Focus on the skills that appear across your target roles",
    summary:
      "Turn missing requirements into a structured preparation plan with documentation, roadmaps, and practice tasks.",
    image: "/landing/skill-gap-preview.png",
    highlights: [
      "High, medium, and low priority gap classification",
      "Curated documentation and hands-on practice links",
      "Direct one-click transition into a targeted mock interview",
    ],
  },
  {
    id: "dashboard",
    step: "Step 3 · Evidence-Based Readiness",
    title: "Build a verified skill profile over time",
    summary:
      "Completed interview evaluations update your skill profile with concrete evidence so you know what to practice next.",
    image: "/landing/dashboard-preview.png",
    highlights: [
      "Clear next best action on your dashboard",
      "Tracks verified skills vs. skills needing practice",
      "Connects resume, job tracker, and interview history",
    ],
  },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeStage, setActiveStage] = useState<string>("match");
  const currentStage =
    PREVIEW_STAGES.find((s) => s.id === activeStage) ?? PREVIEW_STAGES[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* 1. Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-slate-900"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                TH
              </span>
              <span>TrueHire</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
              <a href="#features" className="transition hover:text-slate-900">
                Features
              </a>
              <a
                href="#how-it-works"
                className="transition hover:text-slate-900"
              >
                How it works
              </a>
              <a
                href="#closed-loop"
                className="transition hover:text-slate-900"
              >
                Early Access
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* 2. Hero Section */}
        <section className="border-b border-slate-200 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-medium text-blue-700">
                Evidence-Based Interview Readiness Platform
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Know what you’re ready for before you apply.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                TrueHire analyzes your resume against real engineering roles,
                identifies skill gaps, and helps you practice the interviews
                that matter.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to={user ? "/dashboard" : "/register"}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  <span>Start free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <span>See how it works</span>
                </a>
              </div>
            </div>

            {/* Interactive Product Preview */}
            <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex flex-wrap gap-2">
                  {PREVIEW_STAGES.map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActiveStage(stage.id)}
                      className={`rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                        activeStage === stage.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {stage.step}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-medium text-slate-500">
                  Interactive workflow preview
                </span>
              </div>

              <div className="mt-6 grid items-center gap-8 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    {currentStage.step}
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                    {currentStage.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {currentStage.summary}
                  </p>
                  <ul className="space-y-2.5 pt-2">
                    {currentStage.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-slate-700"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-7">
                  <img
                    src={currentStage.image}
                    alt={currentStage.title}
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Problem Section */}
        <section className="border-b border-slate-200 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                The Problem
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Job preparation is scattered.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Candidates use separate tools for resume analysis, job tracking,
                tailoring, and interview practice—leaving no connection between
                what a role requires and what you practice.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Target className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  Unknown skill gaps
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Applying without knowing which missing requirements appear
                  most frequently across your target engineering roles.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  Generic interview practice
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Practicing random questions that do not test the specific gap
                  skills or technical depth required by your saved jobs.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Award className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  No measurable progress
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Completing mock interviews without a persistent skill profile
                  that tracks which competencies are verified or still need
                  work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. How It Works Section */}
        <section
          id="how-it-works"
          className="border-b border-slate-200 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                How It Works
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Four steps from resume upload to verified readiness
              </h2>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Upload resume",
                  desc: "Upload a PDF or DOCX resume to extract your skills, experience, and project background.",
                },
                {
                  step: "02",
                  title: "Match with real roles",
                  desc: "Compare your profile against verified engineering roles from public company job boards.",
                },
                {
                  step: "03",
                  title: "Identify skill gaps",
                  desc: "See exactly which requirements you meet, which are missing, and how often each gap appears.",
                },
                {
                  step: "04",
                  title: "Practice and improve",
                  desc: "Take targeted mock interviews focused on your gaps and update your verified skill profile.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-6"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 tabular-nums">
                    Step {item.step}
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Core Features Section */}
        <section
          id="features"
          className="border-b border-slate-200 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Core Features
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Everything needed to prepare with evidence
              </h2>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <FileText className="h-5 w-5 text-blue-600" />,
                  title: "Resume intelligence",
                  desc: "Structured PDF and DOCX parsing with user confirmation so you control which extracted skills are used.",
                },
                {
                  icon: <Briefcase className="h-5 w-5 text-blue-600" />,
                  title: "Verified job discovery",
                  desc: "Synchronized engineering listings directly from public Greenhouse job boards with source links.",
                },
                {
                  icon: <Target className="h-5 w-5 text-blue-600" />,
                  title: "Skill-gap analysis",
                  desc: "Transparent requirement coverage showing matched skills, missing skills, and mention frequency.",
                },
                {
                  icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
                  title: "Targeted mock interviews",
                  desc: "Configurable 15 to 60-minute sessions calibrated to your target role, difficulty, and priority skill gaps.",
                },
                {
                  icon: <Award className="h-5 w-5 text-blue-600" />,
                  title: "Evidence-based skill profile",
                  desc: "Every completed interview updates your readiness profile with demonstrated strengths and practice areas.",
                },
                {
                  icon: <Layers className="h-5 w-5 text-blue-600" />,
                  title: "Application tracking",
                  desc: "Organize opportunities from Saved to Offer with match coverage and interview readiness attached.",
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                    {feat.icon}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Differentiator Section: Closed-Loop Readiness */}
        <section
          id="closed-loop"
          className="border-b border-slate-200 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Closed-Loop System
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                More than a resume score.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Instead of stopping at a static match percentage, TrueHire
                connects your interview performance directly back into your
                skill profile and future job matches.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-5">
              {[
                {
                  step: "1. Resume",
                  detail: "Extract baseline skills from your PDF or DOCX",
                },
                {
                  step: "2. Gaps",
                  detail: "Compare against target role requirements",
                },
                {
                  step: "3. Interview",
                  detail: "Practice questions focused on missing skills",
                },
                {
                  step: "4. Evidence",
                  detail: "Rubric evaluation records strengths & weak areas",
                },
                {
                  step: "5. Readiness",
                  detail: "Updated skill profile improves future preparation",
                },
              ].map((node, index) => (
                <div
                  key={node.step}
                  className="relative rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {node.step}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {node.detail}
                  </p>
                  {index < 4 && (
                    <span className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 rounded-full border border-slate-200 bg-white p-1 text-slate-400">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Technical Credibility */}
        <section className="border-b border-slate-200 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <Code2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Full-Stack TypeScript
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Built with React, TypeScript, Node.js, Express, and Zod
                    validation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <Database className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    PostgreSQL & Prisma
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Relational persistence for resumes, matches, interviews, and
                    skill evidence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Greenhouse Integration
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Direct job synchronization from public company ATS boards.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Tested & Verified
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    77 automated Vitest & Supertest checks with JWT
                    authentication.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Final CTA */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Build your readiness profile.
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Upload your resume, see your requirement coverage on real
              engineering roles, and practice targeted interviews.
            </p>
            <div className="mt-7 flex justify-center gap-3">
              <Link
                to={user ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                <span>Create free account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          <span>TrueHire · Evidence-Based Interview Readiness</span>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-slate-800">
              Login
            </Link>
            <Link to="/register" className="hover:text-slate-800">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
