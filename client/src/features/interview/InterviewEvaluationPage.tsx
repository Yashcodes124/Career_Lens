import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Sparkles,
  ArrowRight,
  Briefcase,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Award,
  Clock,
  Calendar,
} from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { CountUpNumber } from "../../components/ui/AceternityPrimitives";

import {
  fetchInterviewById,
  generateInterviewEvaluation,
} from "./interviewApi";
import type {
  Interview,
  InterviewEvaluation,
  InterviewQuestion,
} from "./types";

export const InterviewEvaluationPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(
    null,
  );
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleQuestion = (qId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const loadOrGenerate = async () => {
    if (!interviewId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInterviewById(interviewId);
      setInterview(data);

      if (data.questions?.length > 0) {
        setExpandedQuestions(new Set([data.questions[0].id]));
      }

      if (data.evaluation) {
        setEvaluation(data.evaluation);
        void queryClient.invalidateQueries({ queryKey: ["readiness"] });
      } else if (data.status === "COMPLETED") {
        setGenerating(true);
        const evalData = await generateInterviewEvaluation(interviewId);
        setEvaluation(evalData);
        void queryClient.invalidateQueries({ queryKey: ["readiness"] });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load evaluation",
      );
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    void loadOrGenerate();
  }, [interviewId]);

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <Navbar />
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center text-sm text-slate-600">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p>
            {generating
              ? "Evaluating your interview answers and updating your skill profile..."
              : "Loading interview evaluation..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <p className="mb-4 text-sm text-red-700">
              {error || "Evaluation report is not available yet."}
            </p>
            <button
              type="button"
              onClick={() => void loadOrGenerate()}
              className="w-full rounded-lg bg-blue-600 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { score, feedback, breakdown } = evaluation;
  const sortedQuestions: InterviewQuestion[] = [
    ...(interview?.questions ?? []),
  ].sort((a, b) => a.order - b.order);
  const plan = interview?.plan;

  const competencyItems = [
    { label: "Technical Accuracy", val: breakdown.technicalKnowledge },
    { label: "Problem Solving", val: breakdown.problemSolving },
    { label: "Communication", val: breakdown.communication },
    { label: "Role Relevance", val: breakdown.relevance },
    { label: "Structure & Confidence", val: breakdown.confidence },
  ];

  const assessedSkills =
    plan?.targetSkills && plan.targetSkills.length > 0
      ? plan.targetSkills
      : (plan?.topSkillGaps ?? []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Skill Profile Update Notice */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-blue-600" />
            <span>
              <strong>Skill profile updated:</strong> Strengths and improvement
              areas from this interview have been saved to your readiness
              profile.
            </span>
          </div>
          <Link
            to="/readiness"
            className="font-semibold text-blue-700 hover:underline"
          >
            View skill profile →
          </Link>
        </div>

        {/* 1. Header */}
        <header className="flex flex-col justify-between gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <span>Interview Evaluation</span>
              {plan?.difficulty && (
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-700">
                  {plan.difficulty}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {interview?.title || "Mock Interview Evaluation"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              {plan?.role && plan?.company && (
                <span>
                  {plan.role} at{" "}
                  <strong className="font-medium text-slate-800">
                    {plan.company}
                  </strong>
                </span>
              )}
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {new Date(evaluation.createdAt).toLocaleDateString()}
              </span>
              {plan?.estimatedDuration && (
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {plan.estimatedDuration} min
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-right">
            <p className="text-xs font-medium text-slate-500">Overall Score</p>
            <p className="mt-1 text-3xl font-bold text-blue-600 tabular-nums">
              <CountUpNumber value={score} />
              <span className="text-lg font-normal text-slate-400">/100</span>
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-700">
              {breakdown.recommendation}
            </p>
          </div>
        </header>

        {/* 2. Score Breakdown */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Score Breakdown
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Performance across technical accuracy, problem solving,
            communication, and role relevance
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {competencyItems.map((item) => (
              <div
                key={item.label}
                className="interactive-card rounded-lg border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    {item.label}
                  </span>
                  <span className="text-lg font-semibold text-slate-900 tabular-nums">
                    <CountUpNumber value={item.val} suffix="%" />
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      item.val >= 75
                        ? "bg-emerald-600"
                        : item.val >= 50
                          ? "bg-blue-600"
                          : "bg-amber-500"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, item.val))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3 & 4. Strengths & Improvement Areas */}
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Award className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Strengths Demonstrated
              </h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {breakdown.strengths.map((str, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs leading-relaxed text-slate-800"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Improvement Areas
              </h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {breakdown.improvements.map((imp, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs leading-relaxed text-slate-800"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* 5. Summary & Assessed Skills */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Evaluation Summary & Skill Updates
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {feedback}
          </p>

          {assessedSkills.length > 0 && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-xs font-medium text-slate-500">
                Skills assessed in this session
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {assessedSkills.map((sk) => (
                  <span
                    key={sk}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 6. Question-by-Question Review */}
        {sortedQuestions.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Question-by-Question Review
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Review your answer, score, and specific feedback for each
                  question
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                {sortedQuestions.length}{" "}
                {sortedQuestions.length === 1 ? "question" : "questions"}
              </span>
            </div>

            <ul className="mt-4 space-y-3">
              {sortedQuestions.map((q, index) => {
                const isOpen = expandedQuestions.has(q.id);
                return (
                  <li
                    key={q.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => toggleQuestion(q.id)}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-blue-600">
                            Question {index + 1}
                          </span>
                          <span>·</span>
                          <span>{q.round}</span>
                          {q.score != null && (
                            <span
                              className={`rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums ${
                                q.score >= 75
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : q.score >= 50
                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                    : "border-amber-200 bg-amber-50 text-amber-800"
                              }`}
                            >
                              Score: {q.score}/100
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {q.question}
                        </p>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4 text-xs">
                        <div>
                          <p className="font-semibold text-slate-700">
                            Your Answer
                          </p>
                          <p className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 leading-relaxed text-slate-700">
                            {q.answer || "No answer submitted."}
                          </p>
                        </div>

                        {q.feedback && (
                          <div>
                            <p className="font-semibold text-blue-700">
                              Feedback & Suggested Improvement
                            </p>
                            <p className="mt-1 rounded-lg border border-blue-200 bg-blue-50/60 p-3 leading-relaxed text-slate-800">
                              {q.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 7. Next Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-2.5">
            {interviewId && (
              <Link
                to={`/interviews/${interviewId}/prep`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                <span>Retake interview</span>
              </Link>
            )}
            <Link
              to="/readiness"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <span>View skill profile</span>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Briefcase className="h-3.5 w-3.5 text-blue-600" />
              <span>View related jobs</span>
            </Link>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
