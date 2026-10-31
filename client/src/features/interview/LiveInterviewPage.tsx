import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Send, ArrowRight, CheckCircle2 } from "lucide-react";
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

  const [currentQuestion, setCurrentQuestion] =
    useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState<string>("");
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

      setFeedback(result.evaluation);

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
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117] font-mono text-sm text-zinc-400">
        <div className="flex items-center space-x-3">
          <div className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500" />
          <span>Initializing live interview environment...</span>
        </div>
      </div>
    );
  }

  if (error || !interview || !currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-4">
        <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-[#161b22] p-6 font-mono">
          <p className="mb-4 text-sm text-red-400">
            {error || "Interview session data not found."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => void loadData()}
              className="flex-1 rounded border border-red-500/40 bg-red-950/60 py-2 text-xs text-red-200 transition hover:bg-red-900/80"
            >
              Reconnect Session
            </button>
            <Link
              to="/dashboard"
              className="rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs text-zinc-200 transition hover:bg-zinc-700"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalQuestions = interview.questions.length;
  const currentOrder = currentQuestion.order;
  const progressPercent = Math.round((currentOrder / totalQuestions) * 100);
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-[#0d1117] font-sans text-zinc-200 selection:bg-zinc-800 selection:text-white">
      {/* Top Header / Progress Bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-[#161b22]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <Link
                to="/dashboard"
                className="mr-2 inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400 transition hover:border-zinc-700 hover:text-white"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Exit</span>
              </Link>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs font-medium text-emerald-400">
                {currentQuestion.round}
              </span>
              <span className="rounded border border-zinc-700/50 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                {difficulty}
              </span>
              <span className="font-mono text-xs text-zinc-400">
                · {durationMinutes}m
              </span>
            </div>
            <h1 className="text-sm font-medium tracking-tight text-zinc-300">
              {interview.title || roleTitle}
            </h1>
          </div>

          <div className="text-right font-mono">
            <span className="text-xs text-zinc-400">
              Question{" "}
              <span className="font-bold text-zinc-100">{currentOrder}</span> /{" "}
              {totalQuestions}
            </span>
            <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-1.5 bg-emerald-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* Question Panel */}
        <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-[#161b22] p-6">
          <div className="mb-3 flex items-center justify-between font-mono text-xs text-zinc-500">
            <span>Interviewer Prompt</span>
            <span>Round: {currentQuestion.round}</span>
          </div>
          <h2 className="text-lg font-medium leading-relaxed tracking-tight text-zinc-100 md:text-xl">
            {currentQuestion.question}
          </h2>
        </section>

        {/* Answer Input Panel */}
        <section className="overflow-hidden rounded-xl border border-zinc-800 bg-[#161b22]">
          <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#0d1117] px-4 py-2.5 font-mono text-xs text-zinc-400">
            <div className="flex items-center space-x-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-500/60" />
              <span>candidate_response.md</span>
            </div>
            <span>Press Ctrl+Enter to submit</span>
          </div>

          <div className="p-4">
            <textarea
              rows={8}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={submitting || feedback !== null}
              placeholder="Structure your answer clearly (e.g., Context -> Architecture/Action -> Trade-offs & Measurable Impact)..."
              className="w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none disabled:opacity-50"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between border-t border-zinc-800/80 bg-[#0d1117]/50 px-6 py-3.5">
            <span className="font-mono text-xs text-zinc-500">
              {wordCount} words · {answer.trim().length} chars
            </span>
            {!feedback ? (
              <button
                onClick={() => void handleSubmitAnswer()}
                disabled={!answer.trim() || submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 font-mono text-xs font-bold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                <Send className="h-3.5 w-3.5" />
                <span>
                  {submitting ? "Evaluating Response..." : "Submit Answer"}
                </span>
              </button>
            ) : (
              <button
                onClick={() => void handleAdvance()}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2 font-mono text-xs font-bold text-slate-950 transition-colors hover:bg-teal-400"
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      {submitting
                        ? "Generating Final Evaluation..."
                        : "View Final Results"}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Next Question</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* Rubric Feedback Output */}
        {feedback && (
          <section className="relative space-y-3 rounded-xl border border-emerald-500/30 bg-[#011627] p-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="font-semibold text-emerald-400">
                [Rubric Evaluation Output]
              </span>
              <span className="text-sm font-bold text-emerald-300">
                Score: {feedback.score}/100
              </span>
            </div>
            <p className="pt-1 leading-relaxed text-zinc-300">
              {feedback.feedback}
            </p>

            {((feedback.strengths && feedback.strengths.length > 0) ||
              (feedback.improvements && feedback.improvements.length > 0)) && (
              <div className="grid grid-cols-1 gap-4 border-t border-emerald-500/10 pt-3 md:grid-cols-2">
                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div>
                    <span className="mb-1 block font-semibold text-emerald-400">
                      Strengths Demonstrated:
                    </span>
                    <ul className="list-inside list-disc space-y-1 text-zinc-300">
                      {feedback.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.improvements && feedback.improvements.length > 0 && (
                  <div>
                    <span className="mb-1 block font-semibold text-amber-400">
                      Key Focus Areas (Synced to Skill Profile):
                    </span>
                    <ul className="list-inside list-disc space-y-1 text-zinc-300">
                      {feedback.improvements.map((imp, i) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
