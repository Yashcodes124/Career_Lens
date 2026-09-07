import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchInterviewById, submitInterviewAnswer } from "./interviewApi";
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
  const [feedback, setFeedback] = useState<{
    score: number;
    feedback: string;
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
        navigate(`/interview/${interviewId}/evaluation`);
        return;
      }

      // Find first unanswered question
      const nextUnanswered = data.questions.find((q) => q.answer === null);
      if (nextUnanswered) {
        setCurrentQuestion(nextUnanswered);
      } else if (data.questions.length > 0) {
        // All answered but not marked completed yet
        navigate(`/interview/${interviewId}/evaluation`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load interview session",
      );
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

      setFeedback(result.evaluation);

      if (result.completed || !result.nextQuestion) {
        // Delay redirect briefly so user can see completion
        setTimeout(() => {
          navigate(`/interview/${interviewId}/evaluation`);
        }, 1500);
      } else {
        // Move to next question after small pause or button
        setTimeout(() => {
          setCurrentQuestion(result.nextQuestion);
          setAnswer("");
          setFeedback(null);
        }, 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-600">
          Loading interview session...
        </span>
      </div>
    );
  }

  if (error || !interview || !currentQuestion) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center max-w-xl mx-auto my-8">
        <p className="text-red-700 font-medium mb-4">
          {error || "Interview question not found"}
        </p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const totalQuestions = interview.questions.length;
  const currentOrder = currentQuestion.order;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header / Progress */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Round: {currentQuestion.round}
          </span>
          <h2 className="text-sm font-semibold text-slate-700">
            {interview.title}
          </h2>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
          Question {currentOrder} of {totalQuestions}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 leading-snug">
          {currentQuestion.question}
        </h3>

        {/* Answer Textarea */}
        <textarea
          rows={6}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={submitting || feedback !== null}
          placeholder="Type your structured response here..."
          className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
        />

        {/* Submit Action */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmitAnswer}
            disabled={!answer.trim() || submitting || feedback !== null}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {submitting ? "Evaluating Answer..." : "Submit Answer"}
          </button>
        </div>
      </div>

      {/* Immediate AI Feedback Box */}
      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="font-bold text-emerald-800 text-sm">
              AI Score: {feedback.score}/100
            </span>
            <span className="text-xs text-emerald-600">
              Loading next question...
            </span>
          </div>
          <p className="text-sm text-emerald-900">{feedback.feedback}</p>
        </div>
      )}
    </div>
  );
};
