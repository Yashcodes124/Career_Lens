import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  RotateCcw,
  Layers,
  Sparkles,
  FileCheck2,
} from "lucide-react";
import { Navbar } from "../../components/NavBar";
import {
  fetchUserInterviews,
  generateInterviewEvaluation,
} from "./interviewApi";
import type { Interview } from "./types";

type FilterTab = "ALL" | "LEFT_OFF" | "SCHEDULED" | "COMPLETED";

export const InterviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [generatingEvalId, setGeneratingEvalId] = useState<string | null>(null);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUserInterviews();
      setInterviews(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load your interviews.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInterviews();
  }, []);

  const leftOffList = useMemo(
    () => interviews.filter((i) => i.status === "IN_PROGRESS"),
    [interviews],
  );
  const scheduledList = useMemo(
    () => interviews.filter((i) => i.status === "SCHEDULED"),
    [interviews],
  );
  const completedList = useMemo(
    () => interviews.filter((i) => i.status === "COMPLETED"),
    [interviews],
  );

  const visibleInterviews = useMemo(() => {
    if (activeTab === "LEFT_OFF") return leftOffList;
    if (activeTab === "SCHEDULED") return scheduledList;
    if (activeTab === "COMPLETED") return completedList;
    return interviews;
  }, [interviews, leftOffList, scheduledList, completedList, activeTab]);

  const handleOpenEvaluation = async (interview: Interview) => {
    if (interview.evaluation) {
      navigate(`/interviews/${interview.id}/evaluation`);
      return;
    }
    try {
      setGeneratingEvalId(interview.id);
      await generateInterviewEvaluation(interview.id);
      navigate(`/interviews/${interview.id}/evaluation`);
    } catch {
      navigate(`/interviews/${interview.id}/evaluation`);
    } finally {
      setGeneratingEvalId(null);
    }
  };

  const mostRecentLeftOff = leftOffList[0] ?? scheduledList[0] ?? null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Interview Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Interview Sessions
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Resume an unfinished session where you left off, start a planned
              interview, or inspect your evaluation reports.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>New Role-Specific Interview</span>
          </Link>
        </header>

        {/* Spotlight Banner for Left-Off / Unfinished Interview */}
        {mostRecentLeftOff && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0f19] p-6 text-white shadow-xl">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <span>
                    {mostRecentLeftOff.status === "IN_PROGRESS"
                      ? "Unfinished Session · Pick Up Where You Left Off"
                      : "Configured Session · Ready to Begin"}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">
                  {mostRecentLeftOff.plan?.role ?? mostRecentLeftOff.title}
                  {mostRecentLeftOff.plan?.company ? (
                    <span className="font-normal text-slate-400">
                      {" "}
                      · {mostRecentLeftOff.plan.company}
                    </span>
                  ) : null}
                </h2>
                <p className="text-xs text-slate-300">
                  {
                    mostRecentLeftOff.questions.filter(
                      (q) => q.feedback !== null,
                    ).length
                  }{" "}
                  of {mostRecentLeftOff.questions.length} questions answered ·{" "}
                  {mostRecentLeftOff.plan?.estimatedDuration ?? 30} min ·{" "}
                  {mostRecentLeftOff.plan?.difficulty ?? "MEDIUM"} difficulty
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={
                    mostRecentLeftOff.status === "IN_PROGRESS"
                      ? `/interviews/${mostRecentLeftOff.id}/live`
                      : `/interviews/${mostRecentLeftOff.id}/prep`
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>
                    {mostRecentLeftOff.status === "IN_PROGRESS"
                      ? "Resume Interview Now"
                      : "Review Plan & Start"}
                  </span>
                </Link>
                {mostRecentLeftOff.status === "IN_PROGRESS" && (
                  <Link
                    to={`/interviews/${mostRecentLeftOff.id}/prep`}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:text-white"
                  >
                    View Session Plan
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Summary Metric Strip */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`interactive-card rounded-xl border p-4 text-left ${
              activeTab === "ALL"
                ? "border-blue-600 bg-white ring-2 ring-blue-500/10"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="text-xs font-medium text-slate-500">
              All Sessions
            </span>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
              {interviews.length}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("LEFT_OFF")}
            className={`interactive-card rounded-xl border p-4 text-left ${
              activeTab === "LEFT_OFF"
                ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/15"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="text-xs font-medium text-amber-700">
              Left Off (In Progress)
            </span>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
              {leftOffList.length}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SCHEDULED")}
            className={`interactive-card rounded-xl border p-4 text-left ${
              activeTab === "SCHEDULED"
                ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/15"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="text-xs font-medium text-blue-700">
              Ready to Start
            </span>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
              {scheduledList.length}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("COMPLETED")}
            className={`interactive-card rounded-xl border p-4 text-left ${
              activeTab === "COMPLETED"
                ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/15"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="text-xs font-medium text-emerald-700">
              Completed & Evaluated
            </span>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
              {completedList.length}
            </p>
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadInterviews()}
              className="inline-flex items-center gap-1 font-semibold underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : visibleInterviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <Layers className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-3 text-base font-semibold text-slate-900">
              No interview sessions in this view
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Match your resume with any job role to launch a customized
              technical interview.
            </p>
            <Link
              to="/jobs"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <span>Browse Jobs to Start</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleInterviews.map((item) => {
              const totalQ = item.questions.length;
              const answeredQ = item.questions.filter(
                (q) => q.feedback !== null,
              ).length;
              const progressPct =
                totalQ > 0 ? Math.round((answeredQ / totalQ) * 100) : 0;
              const focusSkills = item.plan?.targetSkills ?? [];
              const evalScore = item.evaluation?.score ?? null;

              return (
                <article
                  key={item.id}
                  className="interactive-card rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.status === "IN_PROGRESS" && (
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Left Off · Question{" "}
                            {Math.min(answeredQ + 1, totalQ)} of {totalQ}
                          </span>
                        )}
                        {item.status === "SCHEDULED" && (
                          <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                            Ready to Start ({totalQ} Questions)
                          </span>
                        )}
                        {item.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Completed
                          </span>
                        )}

                        {item.plan?.difficulty && (
                          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {item.plan.difficulty}
                          </span>
                        )}
                        {item.plan?.estimatedDuration && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {item.plan.estimatedDuration}m
                          </span>
                        )}
                        <span className="text-xs text-slate-400 tabular-nums">
                          · Updated{" "}
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="truncate text-lg font-semibold text-slate-900">
                        {item.plan?.role ?? item.title}
                        {item.plan?.company ? (
                          <span className="font-normal text-slate-500">
                            {" "}
                            at {item.plan.company}
                          </span>
                        ) : null}
                      </h3>

                      {focusSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[11px] font-medium text-slate-400">
                            Focus:
                          </span>
                          {focusSkills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Middle Progress or Evaluation Score */}
                    <div className="w-full lg:w-52">
                      {item.status === "COMPLETED" && evalScore !== null ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3.5 py-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-emerald-800">
                              Evaluation Score
                            </span>
                            <span className="text-sm font-bold text-emerald-700 tabular-nums">
                              {evalScore}/100
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-emerald-200">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${evalScore}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">
                              Question Progress
                            </span>
                            <span className="font-semibold text-slate-800 tabular-nums">
                              {answeredQ}/{totalQ} ({progressPct}%)
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {item.status === "IN_PROGRESS" && (
                        <>
                          <Link
                            to={`/interviews/${item.id}/live`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Resume Left-Off</span>
                          </Link>
                          <Link
                            to={`/interviews/${item.id}/prep`}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Plan
                          </Link>
                        </>
                      )}

                      {item.status === "SCHEDULED" && (
                        <Link
                          to={`/interviews/${item.id}/prep`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Review Plan & Start</span>
                        </Link>
                      )}

                      {item.status === "COMPLETED" && (
                        <>
                          <button
                            type="button"
                            disabled={generatingEvalId === item.id}
                            onClick={() => void handleOpenEvaluation(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-600 disabled:opacity-50"
                          >
                            <FileCheck2 className="h-3.5 w-3.5" />
                            <span>
                              {generatingEvalId === item.id
                                ? "Loading Report..."
                                : "View Evaluation"}
                            </span>
                          </button>
                          <Link
                            to={`/interviews/${item.id}/prep`}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Overview
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default InterviewsPage;
