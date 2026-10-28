import React from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "../auth/useAuth";

const STEPS = [
  {
    step: "01",
    title: "Match",
    body: "Upload a PDF or DOCX resume and compare extracted skills directly against official ATS requirements.",
  },
  {
    step: "02",
    title: "Prioritize",
    body: "Every missing requirement is ranked by posting frequency and past interview evidence.",
  },
  {
    step: "03",
    title: "Interview",
    body: "Run a structured, role-specific technical and behavioral mock session evaluated against a fixed rubric.",
  },
  {
    step: "04",
    title: "Close the Loop",
    body: "Skills flagged weak in your interview automatically update your readiness profile for the next role.",
  },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-teal-500/20 selection:text-teal-200">
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            <span>TrueHire</span>
          </div>
          <nav
            aria-label="Main"
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <a
              href="#how-it-works"
              className="rounded-md px-3 py-1.5 text-zinc-400 transition hover:text-white"
            >
              Architecture
            </a>
            <Link
              to="/login"
              className="rounded-md px-3 py-1.5 text-zinc-400 transition hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-white active:scale-[0.98]"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Editorial Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-400">
              Verified ATS Ingestion · Deterministic Skill Matching
            </p>
            <h1 className="landing-rise mt-4 text-4xl font-semibold tracking-[-0.035em] text-white sm:text-6xl lg:text-[64px] lg:leading-[1.06]">
              From job description to interview-ready.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              TrueHire ingests roles directly from company ATS boards, computes
              a transparent skill-by-skill match score, and runs rubric-graded
              mock interviews whose results feed back into your preparation.
            </p>
            <div
              className="landing-rise mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "100ms" }}
            >
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98]"
              >
                <span>Start readiness loop</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-900"
              >
                How the loop works
              </a>
            </div>
          </div>

          <div
            className="landing-rise mt-14 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-1.5 shadow-2xl"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-2 font-mono text-[11px] text-zinc-500">
              <span>truehire // readiness-workspace</span>
              <span>ATS_SYNC: VERIFIED</span>
            </div>
            <img
              src="/landing/dashboard-preview.png"
              alt="The TrueHire dashboard showing next step, flagged skills, and active applications."
              width={1280}
              height={720}
              className="w-full rounded-b-lg bg-zinc-950"
            />
          </div>
        </section>

        {/* 4-Step Hairline Grid */}
        <section
          id="how-it-works"
          className="border-y border-zinc-800/80 bg-zinc-950/50 py-16"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
                  System Workflow
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  A closed loop, not a static job board
                </h2>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-zinc-400">
                Every interview evaluation writes evidence back to your skill
                profile, recalibrating future job matches automatically.
              </p>
            </div>

            <div className="grid divide-y divide-zinc-800/80 overflow-hidden rounded-xl border border-zinc-800/80 bg-[#09090b] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {STEPS.map((item) => (
                <div
                  key={item.title}
                  className="p-6 transition hover:bg-zinc-900/30"
                >
                  <span className="font-mono text-xs text-teal-400">
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* System Artifact Previews */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              [
                "01 // PARSER",
                "/landing/resume-preview.png",
                "Resume parsed into verifiable skill tokens",
              ],
              [
                "02 // DETERMINISTIC MATCH",
                "/landing/match-preview.png",
                "Explainable match score with ranked gaps",
              ],
              [
                "03 // NON-FABRICATED TAILORING",
                "/landing/tailoring-preview.png",
                "Suggestions strictly bounded by your resume text",
              ],
            ].map(([tag, src, caption]) => (
              <figure
                key={src}
                className="reveal flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-3"
              >
                <div>
                  <span className="font-mono text-[10px] tracking-wider text-zinc-500">
                    {tag}
                  </span>
                  <img
                    src={src}
                    alt={caption}
                    width={1280}
                    height={720}
                    loading="lazy"
                    className="mt-2 w-full rounded-lg border border-zinc-800/60 bg-zinc-950"
                  />
                </div>
                <figcaption className="mt-3 text-xs font-medium text-zinc-300">
                  {caption}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-14 grid gap-8 rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-6 lg:col-span-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-teal-400">
                  Provenance & Traceability
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Every job has a source. Every score has a formula.
                </h2>
              </div>

              <div className="space-y-4 border-l border-zinc-800 pl-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Direct ATS Provenance
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    Listings are synced from official Greenhouse boards with
                    explicit sync timestamps—never scraped from unverified
                    aggregators.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Zero Hallucinated Percentages
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    Match scores come from normalized canonical skill
                    intersection. If a job posting lacks extractable skills,
                    TrueHire reports insufficient data rather than inventing a
                    number.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <img
                src="/landing/skill-gap-preview.png"
                alt="Skill-gap report showing matched skills, missing skills, and interview evidence."
                width={1280}
                height={720}
                loading="lazy"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800/80 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-zinc-500 sm:px-6">
          <span>TrueHire — Verified Job Discovery & AI Readiness</span>
          <span className="font-mono">V1.0 // PRODUCTION</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
