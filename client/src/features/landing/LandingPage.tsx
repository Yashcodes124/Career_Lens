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
  Play,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import {
  ThemeSwitcher,
  BlurText,
  MagneticButton,
  ShinyBadge,
  SpotlightCard,
  AppFooter,
} from "../../components/ui/AceternityPrimitives";

type StageKey = "match" | "gaps" | "interview" | "readiness";

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeStage, setActiveStage] = useState<StageKey>("match");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* 1. Sticky Glass Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-slate-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-xs">
                TH
              </span>
              <span>TrueHire</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
              <a href="#features" className="transition hover:text-blue-600">
                Capabilities
              </a>
              <a
                href="#how-it-works"
                className="transition hover:text-blue-600"
              >
                Workflow
              </a>
              <a href="#closed-loop" className="transition hover:text-blue-600">
                Closed-Loop Engine
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-blue-700"
              >
                <span>Open Workspace</span>
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-blue-700"
                >
                  <span>Start Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="bg-architectural-grid">
        {/* 2. Hero Section — Left Column Slides from Left, Right Obsidian Stage Rises from Bottom-Right */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              {/* Left Column */}
              <div data-reveal="left" className="space-y-6 lg:col-span-6">
                <ShinyBadge>
                  Closed-Loop Engineering Career Readiness
                </ShinyBadge>

                <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
                  <BlurText text="Know what you’re" />{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-500 bg-clip-text text-transparent">
                    ready for
                  </span>{" "}
                  <BlurText text="before you apply." delayStep={0.06} />
                </h1>

                <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                  TrueHire turns your resume and real engineering job
                  requirements into a prioritized skill-gap plan, targeted mock
                  interviews, and an evidence-backed readiness profile.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <MagneticButton>
                    <Link
                      to={user ? "/dashboard" : "/register"}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      <span>{user ? "Go to Dashboard" : "Start free"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </MagneticButton>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 shadow-2xs transition hover:border-blue-400"
                  >
                    <span>Explore verified jobs</span>
                  </Link>
                </div>

                {/* Live Telemetry Proof Cards */}
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <p className="text-lg font-bold text-slate-900 tabular-nums">
                      100%
                    </p>
                    <p className="text-xs text-slate-500">
                      Explainable match coverage
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <p className="text-lg font-bold text-slate-900 tabular-nums">
                      15–60m
                    </p>
                    <p className="text-xs text-slate-500">
                      Gap-targeted mock sessions
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <p className="text-lg font-bold text-slate-900 tabular-nums">
                      Closed-Loop
                    </p>
                    <p className="text-xs text-slate-500">
                      Rubric evidence updates profile
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column — Interactive Obsidian Workspace Preview */}
              <div
                data-reveal="bottom-right"
                className="relative lg:col-span-6"
              >
                <div className="animate-float absolute -top-4 right-4 z-20 hidden items-center gap-2 rounded-xl border border-emerald-500/30 bg-[#0f172a] px-3.5 py-2 text-xs font-medium text-emerald-300 shadow-xl sm:flex">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>
                    Skill Verified: Distributed Caching (+12% Readiness)
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-2xl">
                  {/* Window Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                      <span className="ml-2 font-mono text-[11px] text-slate-400">
                        truehire://workspace/interactive-preview
                      </span>
                    </div>
                    <span className="rounded-md bg-blue-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-300">
                      INTERACTIVE STAGE
                    </span>
                  </div>

                  {/* Interactive Stage Selector Tabs */}
                  <div className="grid grid-cols-4 gap-1 border-b border-slate-800 bg-slate-900/50 p-1.5">
                    {(
                      [
                        { id: "match", label: "1. Job Match" },
                        { id: "gaps", label: "2. Skill Gaps" },
                        { id: "interview", label: "3. Interview" },
                        { id: "readiness", label: "4. Readiness" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveStage(tab.id)}
                        className={`rounded-lg py-2 text-xs font-semibold transition ${
                          activeStage === tab.id
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Stage Body */}
                  <div className="flex min-h-[290px] flex-col justify-between p-5">
                    {activeStage === "match" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                          <div>
                            <p className="text-xs text-slate-400">
                              Backend Engineer · Razorpay (Bengaluru)
                            </p>
                            <p className="mt-0.5 text-base font-semibold text-white">
                              Strong Match · 9 of 11 core requirements met
                            </p>
                          </div>
                          <span className="rounded-lg bg-emerald-500/15 px-3 py-1 font-mono text-lg font-bold text-emerald-400">
                            82%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                              Matched on Resume (9)
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {[
                                "Node.js",
                                "TypeScript",
                                "PostgreSQL",
                                "Docker",
                                "REST APIs",
                              ].map((s) => (
                                <span
                                  key={s}
                                  className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-200"
                                >
                                  {s} ✓
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-3.5">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-400">
                              Missing Requirements (2)
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {["Redis Caching", "Kafka Streams"].map((s) => (
                                <span
                                  key={s}
                                  className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200"
                                >
                                  {s} !
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeStage === "gaps" && (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400">
                          Prioritized by frequency across your target roles:
                        </p>
                        {[
                          {
                            skill: "Redis & Distributed Caching",
                            priority: "High Priority",
                            jobs: "Required by 6 saved jobs",
                          },
                          {
                            skill: "Kafka Event-Driven Microservices",
                            priority: "High Priority",
                            jobs: "Required by 4 saved jobs",
                          },
                          {
                            skill: "System Design & Rate Limiting",
                            priority: "Medium Priority",
                            jobs: "Required by 3 saved jobs",
                          },
                        ].map((item) => (
                          <div
                            key={item.skill}
                            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-3.5"
                          >
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {item.skill}
                              </p>
                              <p className="text-xs text-slate-400">
                                {item.jobs}
                              </p>
                            </div>
                            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                              {item.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeStage === "interview" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-mono text-blue-400">
                            Round 2 · Technical Deep Dive (Redis & PostgreSQL)
                          </span>
                          <span className="font-mono">
                            Question 3 of 5 · 18:40 left
                          </span>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
                          <p className="text-sm leading-relaxed text-slate-100">
                            “How would you prevent cache stampedes in Redis when
                            thousands of concurrent checkout requests hit an
                            expired merchant key?”
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3.5 text-xs text-emerald-200">
                          <span className="font-semibold text-emerald-400">
                            Instant Rubric Evaluation (86/100):
                          </span>{" "}
                          Strong explanation of mutex locks and jittered TTLs.
                          Next: mention stale-while-revalidate trade-offs.
                        </div>
                      </div>
                    )}

                    {activeStage === "readiness" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                          <div>
                            <p className="text-xs text-slate-400">
                              Overall Readiness Index
                            </p>
                            <p className="mt-0.5 text-base font-semibold text-white">
                              78 / 100 · Ready for Mid-Level Backend Screens
                            </p>
                          </div>
                          <Sparkles className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="space-y-2.5">
                          {[
                            { label: "APIs & Backend Architecture", pct: 88 },
                            { label: "Databases & Data Modeling", pct: 82 },
                            { label: "Caching & Distributed Systems", pct: 69 },
                          ].map((bar) => (
                            <div key={bar.label}>
                              <div className="flex justify-between text-xs text-slate-300">
                                <span>{bar.label}</span>
                                <span className="font-mono">{bar.pct}%</span>
                              </div>
                              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                  style={{ width: `${bar.pct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-slate-800/90 pt-3 text-xs text-slate-400">
                      <span>Interactive workflow preview</span>
                      <button
                        type="button"
                        onClick={() => {
                          const order: StageKey[] = [
                            "match",
                            "gaps",
                            "interview",
                            "readiness",
                          ];
                          const next =
                            order[(order.indexOf(activeStage) + 1) % 4];
                          setActiveStage(next);
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300"
                      >
                        <span>Next stage</span>
                        <Play className="h-3 w-3 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Concrete Outcomes Bento Well (No Harsh Full-Width <hr> Lines) */}
        <section className="py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-10">
              <div className="max-w-2xl" data-reveal="left">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Why TrueHire
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Built for serious engineering preparation.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                  Stop guessing why resumes get filtered out or practicing
                  random questions that have nothing to do with your target job.
                </p>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <SpotlightCard revealFrom="left" className="p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <Target className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    Find real requirement gaps
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    See exactly which job requirements are backed by your resume
                    and which skills are still missing before you apply.
                  </p>
                </SpotlightCard>

                <SpotlightCard revealFrom="bottom" className="p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    Practice what matters
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Launch custom 15–60 minute interviews focused directly on
                    your weakest, highest-frequency job requirements.
                  </p>
                </SpotlightCard>

                <SpotlightCard revealFrom="bottom-right" className="p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Award className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    Track verified progress
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Resume unfinished sessions anytime and build an
                    evidence-based skill profile with every completed
                    evaluation.
                  </p>
                </SpotlightCard>
              </div>
            </div>
          </div>
        </section>

        {/* 4. How It Works — 4-Step Directional Choreography */}
        <section id="how-it-works" className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl" data-reveal="left">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Workflow Architecture
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Four steps from resume upload to verified readiness
              </h2>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Upload resume",
                  desc: "Upload a PDF or DOCX resume and confirm your extracted technical skills.",
                  dir: "left" as const,
                },
                {
                  step: "02",
                  title: "Match with real roles",
                  desc: "Compare your profile against verified engineering roles or paste any external JD.",
                  dir: "bottom" as const,
                },
                {
                  step: "03",
                  title: "Identify skill gaps",
                  desc: "Inspect requirement coverage and prioritize missing skills by role frequency.",
                  dir: "bottom" as const,
                },
                {
                  step: "04",
                  title: "Practice & verify",
                  desc: "Complete targeted mock interviews that feed evidence back into your readiness score.",
                  dir: "bottom-right" as const,
                },
              ].map((item) => (
                <SpotlightCard
                  key={item.step}
                  revealFrom={item.dir}
                  className="p-6"
                >
                  <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 tabular-nums">
                    Step {item.step}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Core Features Grid */}
        <section id="features" className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl" data-reveal="left">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Platform Capabilities
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Everything needed to prepare with evidence
              </h2>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <FileText className="h-5 w-5 text-blue-600" />,
                  title: "Editable resume intelligence",
                  desc: "Structured PDF and DOCX parsing with interactive skill chips so you control your profile.",
                },
                {
                  icon: <Briefcase className="h-5 w-5 text-blue-600" />,
                  title: "Verified job discovery & importer",
                  desc: "Sync public ATS roles or paste any LinkedIn/Naukri job description for instant analysis.",
                },
                {
                  icon: <Target className="h-5 w-5 text-blue-600" />,
                  title: "Explainable match coverage",
                  desc: "Every score shows the exact denominator of matched requirements vs. missing skills.",
                },
                {
                  icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
                  title: "Resumable mock interviews",
                  desc: "Pick up left-off sessions on the exact question you paused on, with local draft autosave.",
                },
                {
                  icon: <Award className="h-5 w-5 text-blue-600" />,
                  title: "Closed-loop skill profile",
                  desc: "Rubric evaluations automatically promote demonstrated skills into verified strengths.",
                },
                {
                  icon: <Layers className="h-5 w-5 text-blue-600" />,
                  title: "Application pipeline tracker",
                  desc: "Track roles across Saved, Applied, Interviewing, and Offer with match telemetry attached.",
                },
              ].map((feat, idx) => (
                <SpotlightCard
                  key={feat.title}
                  revealFrom={idx % 2 === 0 ? "left" : "bottom-right"}
                  className="p-6"
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
                </SpotlightCard>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Closed-Loop Architecture Bento Section */}
        <section id="closed-loop" className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-10">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Closed-Loop System
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  More than a static resume score.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                  Every interview you complete feeds structured rubric evidence
                  back into your skill profile and future job matches.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-5">
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
                    detail: "Updated skill profile improves future matches",
                  },
                ].map((node, index) => (
                  <div
                    key={node.step}
                    data-reveal={index < 2 ? "left" : "bottom-right"}
                    className="interactive-card relative rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {node.step}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {node.detail}
                    </p>
                    {index < 4 && (
                      <span className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1 text-slate-400 lg:block">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="interactive-card flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <Code2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Full-Stack TypeScript
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      React, TypeScript, Node.js, Express & Zod contracts.
                    </p>
                  </div>
                </div>
                <div className="interactive-card flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <Database className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      PostgreSQL & Prisma
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Relational persistence for resumes, interviews & evidence.
                    </p>
                  </div>
                </div>
                <div className="interactive-card flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      ATS & Multi-Board Sync
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Greenhouse feeds plus LinkedIn & Naukri JD analyzer.
                    </p>
                  </div>
                </div>
                <div className="interactive-card flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Deterministic Guardrails
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Zero fabricated skills with 77 automated test checks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Floating Call-to-Action Banner */}
        <section className="py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b0f19] px-6 py-14 text-center text-white shadow-2xl sm:px-12">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Ready to see where you stand?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
                Upload your resume, inspect your requirement coverage on real
                engineering roles, and practice targeted interviews.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <MagneticButton>
                  <Link
                    to={user ? "/dashboard" : "/register"}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
                  >
                    <span>
                      {user ? "Open Dashboard" : "Create free account"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </MagneticButton>
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                >
                  <span>Browse Job Board</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
};

export default LandingPage;
