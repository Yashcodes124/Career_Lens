import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    loadInterview();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-slate-300">
          Loading interview details...
        </span>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800/50 rounded-xl text-center max-w-xl mx-auto my-8">
        <p className="text-red-300 font-medium mb-4">
          {error || "Interview not found"}
        </p>
        <button
          onClick={loadInterview}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { plan, status, title } = interview;

  if (!plan) {
    return (
      <div className="p-6 bg-amber-950/40 border border-amber-800/50 rounded-xl text-center max-w-xl mx-auto my-8">
        <p className="text-amber-300 font-medium">
          Interview plan is missing or still generating.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 text-slate-100">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {plan.role}
            </h1>
            <p className="text-lg font-medium text-slate-300 mt-1 capitalize">
              {plan.company}
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold text-xs rounded-full uppercase tracking-wider">
            {plan.difficulty} Difficulty
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-3">{title}</p>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Stats */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-md font-semibold text-white border-b border-slate-700 pb-3">
            Session Overview
          </h2>
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Match Score:</span>
            <span className="font-bold text-emerald-400">
              {plan.matchScore}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Estimated Duration:</span>
            <span className="font-semibold text-slate-200">
              {plan.estimatedDuration} minutes
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Total Rounds:</span>
            <span className="font-semibold text-slate-200">
              {plan.rounds.length} rounds
            </span>
          </div>
        </div>

        {/* Target Skills & Gaps */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-md font-semibold text-white border-b border-slate-700 pb-3">
            Skills & Focus Areas
          </h2>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Target Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {plan.targetSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-700/80 text-slate-200 text-xs rounded-md border border-slate-600"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          {plan.topSkillGaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Top Focus Gaps
              </p>
              <div className="flex flex-wrap gap-2">
                {plan.topSkillGaps.map((gap, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-amber-500/20 text-amber-200 text-xs rounded-md border border-amber-500/30 font-medium"
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
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl">
        <h2 className="text-md font-semibold text-white mb-4 border-b border-slate-700 pb-3">
          Interview Structure
        </h2>
        <div className="divide-y divide-slate-700">
          {plan.rounds.map((round, idx) => (
            <div key={idx} className="py-3 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-slate-700 text-indigo-400 text-xs flex items-center justify-center font-bold border border-slate-600">
                  {idx + 1}
                </span>
                <span className="font-medium text-slate-200 text-sm">
                  {round.name}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {round.duration} min
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-300">
            Current Status:{" "}
            <span className="font-bold text-indigo-400 uppercase text-xs tracking-wider">
              {status}
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Ensure your setup is ready before beginning.
          </p>
        </div>

        {status === "SCHEDULED" && (
          <button
            onClick={handleStartInterview}
            disabled={starting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition"
          >
            {starting ? "Starting..." : "Start Interview"}
          </button>
        )}

        {status === "IN_PROGRESS" && (
          <button
            onClick={handleStartInterview}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition"
          >
            Continue Interview
          </button>
        )}

        {status === "COMPLETED" && (
          <button
            onClick={() => navigate(`/interviews/${interviewId}/evaluation`)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-600/30 transition"
          >
            View Evaluation
          </button>
        )}
      </div>
    </div>
  );
};
