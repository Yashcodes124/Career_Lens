import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  ArrowRight,
  CheckCircle2,
  Clock,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  fetchInterviewById,
  submitInterviewAnswer,
  generateInterviewEvaluation,
} from "./interviewApi";
import { Interview, InterviewQuestion } from "./types";

interface LocationState {
  durationMinutes?: number;
  difficulty?: "EASY" | "MEDIUM" | "DIFFICULT";
  focusTopics?: string[];
  roleTitle?: string;
}

const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const LiveInterviewPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const navState = (location.state as LocationState) || {};
  const [interview, setInterview] = useState<Interview | null>(null);

  const durationMinutes =
    interview?.plan?.estimatedDuration ?? navState.durationMinutes ?? 30;
  const difficulty =
    interview?.plan?.difficulty ?? navState.difficulty ?? "MEDIUM";
  const roleTitle =
    interview?.plan?.role ?? navState.roleTitle ?? "Software Engineer";
  const companyName = interview?.plan?.company ?? "";

  const [currentQuestion, setCurrentQuestion] =
    useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [pendingNextQuestion, setPendingNextQuestion] =
    useState<InterviewQuestion | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const [feedback, setFeedback] = useState<{
    score: number;
    feedback: string;
    strengths?: string[];
    improvements?: string[];
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const draftKey =
    interviewId && currentQuestion
      ? `truehire_draft_${interviewId}_${currentQuestion.id}`
      : null;

  // Session timer
  useEffect(() => {
    if (loading) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [loading]);

  // Restore saved draft when switching questions
  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved && !answer) {
        setAnswer(saved);
      }
    } catch {
      // Ignore storage access errors
    }
  }, [draftKey]);

  // Autosave draft on answer change
  const handleAnswerChange = (value: string) => {
    setAnswer(value);
    if (draftKey) {
      try {
        localStorage.setItem(draftKey, value);
        setDraftSavedAt("Draft saved");
      } catch {
        // Ignore storage errors
      }
    }
  };

  const loadData = async () => {
    if (!interviewId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInterviewById(interviewId);
      setInterview(data);

      if (data.status === "COMPLETED") {
        navigate(`/interviews/${interviewId}/evaluation`);
        return;
      }

      const nextUnanswered = data.questions.find((q) => q.answer === null);
      if (nextUnanswered) {
        setCurrentQuestion(nextUnanswered);
      } else if (data.questions.length > 0) {
        navigate(`/interviews/${interviewId}/evaluation`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [interviewId]);

  const handleSubmitAnswer = async () => {
    if (!interviewId || !currentQuestion || !answer.trim() || submitting)
      return;

    try {
      setSubmitting(true);
      setError(null);

      const result = await submitInterviewAnswer(
        interviewId,
        currentQuestion.id,
        answer.trim(),
      );

      if (draftKey) {
        try {
          localStorage.removeItem(draftKey);
        } catch {
          // Ignore
        }
      }

      setFeedback(result.evaluation);

      // Update local question list so progress sidebar reflects completion
      setInterview((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((q) =>
                q.id === currentQuestion.id
                  ? {
                      ...q,
                      answer: answer.trim(),
                      score: result.evaluation.score,
                      feedback: result.evaluation.feedback,
                    }
                  : q,
              ),
            }
          : prev,
      );

      if (result.completed || !result.nextQuestion) {
        setIsCompleted(true);
      } else {
        setPendingNextQuestion(result.nextQuestion);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvance = async () => {
    if (isCompleted) {
      try {
        setSubmitting(true);
        await generateInterviewEvaluation(interviewId!);
        navigate(`/interviews/${interviewId}/evaluation`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate evaluation",
        );
        setSubmitting(false);
      }
    } else if (pendingNextQuestion) {
      setCurrentQuestion(pendingNextQuestion);
      setPendingNextQuestion(null);
      setAnswer("");
      setDraftSavedAt(null);
      setFeedback(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      (e.metaKey || e.ctrlKey) &&
      e.key === "Enter" &&
      !feedback &&
      !submitting
    ) {
      e.preventDefault();
      void handleSubmitAnswer();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600" />
          <span>Loading your interview session...</span>
        </div>
      </div>
    );
  }

  if (error || !interview || !currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm text-red-700">
            {error || "Interview session data could not be loaded."}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void loadData()}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
            >
              Try again
            </button>
            <Link
              to="/dashboard"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Exit to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sortedQuestions = [...interview.questions].sort(
    (a, b) => a.order - b.order,
  );
  const totalQuestions = sortedQuestions.length;
  const currentOrder = currentQuestion.order;
  const progressPercent = Math.round((currentOrder / totalQuestions) * 100);
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* 1. Interview Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Exit interview</span>
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">
                {roleTitle}
                {companyName ? (
                  <span className="font-normal text-slate-500">
                    {" "}
                    · {companyName}
                  </span>
                ) : null}
              </h1>
              <p className="text-xs text-slate-500">
                {currentQuestion.round} · {difficulty} difficulty
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 tabular-nums">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>
                {formatTimer(elapsedSeconds)} / {durationMinutes}:00
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-slate-800 tabular-nums">
                Question {currentOrder} of {totalQuestions}
              </span>
              <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="space-y-6">
            {/* 2. Current Question Card */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    Question {currentOrder} of {totalQuestions}
                  </span>
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {currentQuestion.round}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  Difficulty: {difficulty}
                </span>
              </div>

              <h2 className="text-lg font-semibold leading-relaxed text-slate-900 sm:text-xl">
                {currentQuestion.question}
              </h2>

              <p className="mt-3 text-xs text-slate-500">
                Expected structure: Briefly state the context, explain your
                technical approach or implementation, and highlight key
                trade-offs or edge cases.
              </p>
            </section>

            {/* 3. Answer Area */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
                <span className="font-medium text-slate-700">Your Answer</span>
                <div className="flex items-center gap-3">
                  {draftSavedAt && (
                    <span className="text-emerald-600 font-medium">
                      {draftSavedAt}
                    </span>
                  )}
                  <span className="text-slate-400">Ctrl + Enter to submit</span>
                </div>
              </div>

              <div className="p-4">
                <textarea
                  rows={8}
                  value={answer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={submitting || feedback !== null}
                  placeholder="Write your response here..."
                  className="w-full resize-none bg-white text-sm leading-relaxed text-slate-900 placeholder-slate-400 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
                <span className="text-xs text-slate-500 tabular-nums">
                  {wordCount} {wordCount === 1 ? "word" : "words"} ·{" "}
                  {answer.trim().length} characters
                </span>

                {!feedback ? (
                  <button
                    type="button"
                    onClick={() => void handleSubmitAnswer()}
                    disabled={!answer.trim() || submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {submitting ? "Evaluating answer..." : "Submit answer"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleAdvance()}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {submitting
                            ? "Generating final evaluation..."
                            : "View final evaluation"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Next question</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>

            {/* 4. Per-Answer Feedback State */}
            {feedback && (
              <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Answer Feedback
                  </h3>
                  <span
                    className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                      feedback.score >= 75
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : feedback.score >= 50
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    Score: {feedback.score}/100
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-slate-700">
                  {feedback.feedback}
                </p>

                {((feedback.strengths && feedback.strengths.length > 0) ||
                  (feedback.improvements &&
                    feedback.improvements.length > 0)) && (
                  <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
                    {feedback.strengths && feedback.strengths.length > 0 && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5">
                        <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          What was good
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {feedback.strengths.map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feedback.improvements &&
                      feedback.improvements.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5">
                          <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            How to improve
                          </span>
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            {feedback.improvements.map((imp, i) => (
                              <li key={i}>• {imp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* 5. Question Progress Sidebar */}
          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Question Progress
            </h3>
            <ul className="mt-3 space-y-2">
              {sortedQuestions.map((q) => {
                const isCurrent = q.id === currentQuestion.id;
                const isDone = q.answer !== null;
                return (
                  <li
                    key={q.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                      isCurrent
                        ? "border-blue-300 bg-blue-50 font-semibold text-blue-800"
                        : isDone
                          ? "border-emerald-200 bg-emerald-50/50 text-emerald-800"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span className="truncate">
                      Q{q.order} · {q.round}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {isDone
                        ? q.score != null
                          ? `${q.score}%`
                          : "Done"
                        : isCurrent
                          ? "Current"
                          : "Pending"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
};
