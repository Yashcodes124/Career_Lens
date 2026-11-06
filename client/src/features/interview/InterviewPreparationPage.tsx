import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Clock,
  Layers,
  Target,
  AlertTriangle,
  Play,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { fetchInterviewById, startInterview } from "./interviewApi";
import { Interview } from "./types";

const PREP_CHECKLIST = [
  "Review job requirements and how your recent projects align",
  "Review priority skill gaps and core concepts before starting",
  "Prepare a concise explanation of your most complex architecture decision",
  "Prepare concrete examples of technical trade-offs, bottlenecks, and metrics",
];

export const InterviewPreparationPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [starting, setStarting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadInterview = async () => {
    if (!interviewId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInterviewById(interviewId);
      setInterview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInterview();
  }, [interviewId]);

  const handleStartInterview = async () => {
    if (!interviewId || starting) return;
    try {
      setStarting(true);
      if (interview?.status === "SCHEDULED") {
        await startInterview(interviewId);
      }
      navigate(`/interviews/${interviewId}/live`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start interview",
      );
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            <span className="mt-3 text-sm text-slate-600">
              Loading your interview plan...
            </span>
          </div>
        ) : error || !interview ? (
          <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="mb-4 text-sm font-medium text-red-800">
              {error || "Interview not found"}
            </p>
            <button
              type="button"
              onClick={() => void loadInterview()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        ) : !interview.plan ? (
          <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-sm font-medium text-amber-800">
              Interview plan is missing or still generating.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Header */}
            <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    Prepare for Interview
                  </span>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    {interview.plan.role}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {interview.plan.company}
                  </p>
                </div>
                <span className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Difficulty: {interview.plan.difficulty}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{interview.title}</p>
            </header>

            {/* 2 & 3. Overview & Skills to Assess */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">
                  Session Preview
                </h2>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Target className="h-4 w-4 text-blue-600" />
                    Role Match Score
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {interview.plan.matchScore != null
                      ? `${interview.plan.matchScore}%`
                      : "Not scored"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Estimated Duration
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {interview.plan.estimatedDuration} minutes
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Layers className="h-4 w-4 text-blue-600" />
                    Planned Rounds
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {interview.plan.rounds.length} rounds
                  </span>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">
                  Skills to Assess
                </h2>
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Focus skills for this interview
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {interview.plan.targetSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {interview.plan.topSkillGaps.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      Priority skill gaps included
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {interview.plan.topSkillGaps.map((gap, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Planned Rounds Breakdown & Preparation Checklist */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">
                  Planned Rounds
                </h2>
                <div className="divide-y divide-slate-200">
                  {interview.plan.rounds.map((round, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 tabular-nums">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-900">
                          {round.name}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500 tabular-nums">
                        {round.duration} min
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">
                  Preparation Checklist
                </h2>
                <ul className="space-y-3">
                  {PREP_CHECKLIST.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-700"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* 4. Start Interview CTA */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/70 p-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Ready to begin your interview?
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Each answer will be evaluated with structured feedback and
                  used to update your skill readiness profile.
                </p>
              </div>

              {interview.status === "SCHEDULED" && (
                <button
                  type="button"
                  onClick={() => void handleStartInterview()}
                  disabled={starting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>{starting ? "Starting..." : "Start interview"}</span>
                </button>
              )}

              {interview.status === "IN_PROGRESS" && (
                <button
                  type="button"
                  onClick={() => void handleStartInterview()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Continue interview</span>
                </button>
              )}

              {interview.status === "COMPLETED" && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/interviews/${interviewId}/evaluation`)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>View evaluation report</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
