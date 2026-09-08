import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchInterviewById,
  submitInterviewAnswer,
  generateInterviewEvaluation,
} from "./interviewApi";
import { Interview, InterviewQuestion } from "./types";

export const LiveInterviewPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
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
    loadData();
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

      // 1. Render feedback panel
      setFeedback(result.evaluation);

      // 2. Store next question state without advancing immediately
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-zinc-400 font-mono text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Initializing interview environment...</span>
        </div>
      </div>
    );
  }

  if (error || !interview || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-red-500/30 rounded-lg p-6 font-mono">
          <p className="text-red-400 text-sm mb-4">
            {error || "Interview session data not found."}
          </p>
          <button
            onClick={loadData}
            className="w-full py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-200 text-xs uppercase tracking-wider rounded transition"
          >
            Reconnect Session
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = interview.questions.length;
  const currentOrder = currentQuestion.order;
  const progressPercent = Math.round((currentOrder / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-[#0d1117] text-zinc-200 font-sans selection:bg-zinc-800 selection:text-white">
      {/* Top Header / Progress Bar */}
      <header className="border-b border-zinc-800/80 bg-[#161b22]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-medium">
                {currentQuestion.round}
              </span>
            </div>
            <h1 className="text-sm font-medium text-zinc-300 tracking-tight">
              {interview.title}
            </h1>
          </div>

          <div className="text-right font-mono">
            <span className="text-xs text-zinc-400">
              Question{" "}
              <span className="text-zinc-100 font-bold">{currentOrder}</span> /{" "}
              {totalQuestions}
            </span>
            <div className="w-32 bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Question Panel */}
        <section className="bg-[#161b22] border border-zinc-800 rounded-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
            // Prompt Execution
          </div>
          <h2 className="text-lg md:text-xl font-medium text-zinc-100 leading-relaxed tracking-tight">
            {currentQuestion.question}
          </h2>
        </section>

        {/* Answer Input Panel */}
        <section className="bg-[#161b22] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-[#0d1117] px-4 py-2.5 border-b border-zinc-800/80 flex items-center justify-between font-mono text-xs text-zinc-400">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-zinc-800 inline-block" />
              <span>response.md</span>
            </div>
            <span>Markdown Enabled</span>
          </div>

          <div className="p-4">
            <textarea
              rows={8}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={submitting || feedback !== null}
              placeholder="Type your response here..."
              className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 font-mono text-sm leading-relaxed outline-none resize-none disabled:opacity-50"
            />
          </div>

          {/* Action Footer */}
          <div className="px-6 py-3.5 bg-[#0d1117]/50 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="font-mono text-xs text-zinc-500">
              {answer.trim().length} chars
            </span>
            {!feedback ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-mono font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md disabled:shadow-none"
              >
                {submitting ? "Evaluating Response..." : "Submit Answer"}
              </button>
            ) : (
              <button
                onClick={handleAdvance}
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md"
              >
                {submitting
                  ? "Generating Final Evaluation..."
                  : isCompleted
                    ? "View Final Results →"
                    : "Next Question →"}
              </button>
            )}
          </div>
        </section>

        {/* Terminal Feedback Output */}
        {feedback && (
          <section className="bg-[#011627] border border-emerald-500/30 rounded-xl p-5 font-mono text-xs space-y-3 shadow-xl animate-in fade-in duration-200 relative">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-emerald-400 font-semibold tracking-wider uppercase">
                [AI Evaluation Output]
              </span>
              <span className="text-emerald-300 font-bold text-sm">
                Score: {feedback.score}/100
              </span>
            </div>
            <p className="text-zinc-300 leading-relaxed pt-1">
              {feedback.feedback}
            </p>

            {((feedback.strengths && feedback.strengths.length > 0) ||
              (feedback.improvements && feedback.improvements.length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-emerald-500/10">
                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div>
                    <span className="text-emerald-400 font-semibold block mb-1">
                      Strengths:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                      {feedback.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.improvements && feedback.improvements.length > 0 && (
                  <div>
                    <span className="text-amber-400 font-semibold block mb-1">
                      Key Focus Areas:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
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
