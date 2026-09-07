import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchInterviewById,
  generateInterviewEvaluation,
} from "./interviewApi";
import { Interview, InterviewEvaluation } from "./types";

export const InterviewEvaluationPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrGenerate = async () => {
    if (!interviewId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInterviewById(interviewId);
      setInterview(data);

      if (data.evaluation) {
        setEvaluation(data.evaluation);
      } else if (data.status === "COMPLETED") {
        setGenerating(true);
        const evalData = await generateInterviewEvaluation(interviewId);
        setEvaluation(evalData);
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
    loadOrGenerate();
  }, [interviewId]);

  if (loading || generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-700 font-medium">
          {generating
            ? "Generating holistic AI evaluation..."
            : "Loading evaluation..."}
        </p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center max-w-xl mx-auto my-8">
        <p className="text-red-700 font-medium mb-4">
          {error || "Evaluation unavailable"}
        </p>
        <button
          onClick={loadOrGenerate}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { score, feedback, breakdown } = evaluation;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Overall Score */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Interview Evaluation
          </h1>
          <p className="text-sm text-slate-500 mt-1">{interview?.title}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-extrabold text-indigo-600">
            {score}/100
          </span>
          <p className="text-xs text-slate-400 font-medium">Overall Score</p>
        </div>
      </div>

      {/* Recommendation & Overview Feedback */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-semibold text-slate-800">
            Recommendation
          </h2>
          <span className="px-3 py-1 bg-slate-100 font-bold text-xs uppercase text-slate-800 rounded-md">
            {breakdown.recommendation}
          </span>
        </div>
        <p className="text-slate-700 text-sm leading-relaxed">{feedback}</p>
      </div>

      {/* Skill Breakdown Grid */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">
          Category Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {[
            { label: "Technical", val: breakdown.technicalKnowledge },
            { label: "Problem Solving", val: breakdown.problemSolving },
            { label: "Communication", val: breakdown.communication },
            { label: "Relevance", val: breakdown.relevance },
            { label: "Confidence", val: breakdown.confidence },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <span className="block text-xl font-bold text-slate-800">
                {item.val}
              </span>
              <span className="text-xs text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-md font-bold text-emerald-700 border-b pb-2">
            Key Strengths
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-700">
            {breakdown.strengths.map((str, idx) => (
              <li key={idx}>{str}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-md font-bold text-amber-700 border-b pb-2">
            Areas for Improvement
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-700">
            {breakdown.improvements.map((imp, idx) => (
              <li key={idx}>{imp}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
