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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-teal-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-teal-400" />
            <span className="mt-3 text-sm text-slate-300">
              Loading role-specific interview plan...
            </span>
          </div>
        ) : error || !interview ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-red-800/50 bg-red-950/40 p-6 text-center">
            <p className="mb-4 text-sm font-medium text-red-300">
              {error || "Interview not found"}
            </p>
            <button
              onClick={() => void loadInterview()}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
            >
              Retry
            </button>
          </div>
        ) : !interview.plan ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-amber-800/50 bg-amber-950/40 p-6 text-center">
            <p className="text-sm font-medium text-amber-300">
              Interview plan is missing or still generating.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-0.5 text-xs font-semibold text-teal-300">
                    Role-Specific Mock Interview
                  </span>
                  <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {interview.plan.role}
                  </h1>
                  <p className="mt-1 text-base font-medium capitalize text-slate-300">
                    {interview.plan.company}
                  </p>
                </div>
                <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
                  Difficulty: {interview.plan.difficulty}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">{interview.title}</p>
            </div>

            {/* Overview & Target Skills */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <h2 className="border-b border-slate-800 pb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Session Overview
                </h2>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Target className="h-4 w-4 text-teal-400" />
                    Match Score
                  </span>
                  <span className="font-bold text-emerald-400">
                    {interview.plan.matchScore != null
                      ? `${interview.plan.matchScore}%`
                      : "Not available"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Clock className="h-4 w-4 text-teal-400" />
                    Estimated Duration
                  </span>
                  <span className="font-semibold text-slate-200">
                    {interview.plan.estimatedDuration} minutes
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Layers className="h-4 w-4 text-teal-400" />
                    Total Rounds
                  </span>
                  <span className="font-semibold text-slate-200">
                    {interview.plan.rounds.length} rounds
                  </span>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <h2 className="border-b border-slate-800 pb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Skills & Focus Areas
                </h2>
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-400">
                    Target Skills Evaluated
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {interview.plan.targetSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {interview.plan.topSkillGaps.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Priority Skill Gaps Probed
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {interview.plan.topSkillGaps.map((gap, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rounds Breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h2 className="mb-4 border-b border-slate-800 pb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                Interview Structure
              </h2>
              <div className="divide-y divide-slate-800">
                {interview.plan.rounds.map((round, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10 text-xs font-bold text-teal-300">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-100">
                        {round.name}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      {round.duration} min
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 p-6">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Session Status:{" "}
                  <span className="rounded-md bg-teal-500/15 px-2 py-0.5 text-xs font-bold text-teal-300">
                    {interview.status}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Each answer is scored against a structured rubric and updates
                  your readiness profile.
                </p>
              </div>

              {interview.status === "SCHEDULED" && (
                <button
                  onClick={() => void handleStartInterview()}
                  disabled={starting}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:opacity-50"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>{starting ? "Starting..." : "Start Interview"}</span>
                </button>
              )}

              {interview.status === "IN_PROGRESS" && (
                <button
                  onClick={() => void handleStartInterview()}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Continue Interview</span>
                </button>
              )}

              {interview.status === "COMPLETED" && (
                <button
                  onClick={() =>
                    navigate(`/interviews/${interviewId}/evaluation`)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>View Evaluation Report</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
