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
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center font-mono text-sm text-zinc-400">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping mb-4" />
        <p>
          {generating
            ? "Synthesizing holistic AI evaluation report..."
            : "Retrieving session analytics..."}
        </p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-red-500/30 rounded-xl p-6 font-mono text-center">
          <p className="text-red-400 text-sm mb-4">
            {error || "Evaluation report unavailable."}
          </p>
          <button
            onClick={loadOrGenerate}
            className="w-full py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-200 text-xs uppercase tracking-wider rounded transition"
          >
            Retry Generation
          </button>
        </div>
      </div>
    );
  }

  const { score, feedback, breakdown } = evaluation;

  // Split feedback into distinct scannable sentences
  const feedbackPoints = feedback
    .split(/(?<=\.)\s+/)
    .filter((sentence) => sentence.trim().length > 0);

  return (
    <div className="min-h-screen bg-[#0d1117] text-zinc-200 font-sans p-6 md:p-10 selection:bg-zinc-800">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 1. Header / Score Banner */}
        <header className="bg-[#161b22] border border-zinc-800 rounded-xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-medium">
                Session Final Assessment
              </span>
            </div>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              {interview?.title || "Mock Interview Report"}
            </h1>
          </div>

          <div className="bg-[#0d1117] border border-zinc-800 rounded-lg px-6 py-3 text-right">
            <span className="text-3xl font-mono font-bold text-emerald-400">
              {score}/100
            </span>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
              Overall Rating
            </p>
          </div>
        </header>

        {/* 2. Competency Metrics */}
        <section className="bg-[#161b22] border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 border-b border-zinc-800 pb-3">
            // Competency Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
            {[
              { label: "Technical", val: breakdown.technicalKnowledge },
              { label: "Problem Solving", val: breakdown.problemSolving },
              { label: "Communication", val: breakdown.communication },
              { label: "Relevance", val: breakdown.relevance },
              { label: "Confidence", val: breakdown.confidence },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[#0d1117] border border-zinc-800/80 rounded-lg text-center"
              >
                <span className="block text-xl font-bold text-zinc-100">
                  {item.val}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Strengths & Focus Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-[#161b22] border border-emerald-500/20 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 border-b border-emerald-500/20 pb-2">
              [+] Key Strengths
            </h3>
            <div className="space-y-2">
              {breakdown.strengths.map((str, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 p-2.5 bg-[#0d1117]/60 border border-emerald-500/10 rounded-lg text-xs text-zinc-300"
                >
                  <span className="text-emerald-400 font-mono text-sm leading-none">
                    ✓
                  </span>
                  <span className="leading-relaxed">{str}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#161b22] border border-amber-500/20 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 border-b border-amber-500/20 pb-2">
              [-] Critical Focus Areas
            </h3>
            <div className="space-y-2">
              {breakdown.improvements.map((imp, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 p-2.5 bg-[#0d1117]/60 border border-amber-500/10 rounded-lg text-xs text-zinc-300"
                >
                  <span className="text-amber-400 font-mono text-sm leading-none">
                    !
                  </span>
                  <span className="leading-relaxed">{imp}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 4. Overall Recommendation & Synthesis */}
        <section className="bg-[#161b22] border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-5">
          {/* 1. Header & Subheading */}
          <div>
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Overall Recommendation & Synthesis
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Holistic summary of performance, system trade-offs, and hiring
              suitability
            </p>
          </div>

          {/* 2. Highlight Callout Box (Full-Width Row) */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-xs text-amber-300 leading-relaxed font-sans">
              <span className="font-mono font-bold uppercase tracking-wider text-amber-400 mr-2">
                {breakdown.recommendation} —
              </span>
              {feedback}
            </p>
          </div>

          {/* 3. Itemized Points Cards */}
          <div className="space-y-3 pt-1">
            {feedbackPoints.map((point, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#0d1117] border border-zinc-800/80 rounded-lg text-xs text-zinc-300 leading-relaxed flex items-start space-x-3"
              >
                <span className="font-mono text-emerald-400 font-bold text-xs select-none pt-0.5">
                  0{idx + 1}.
                </span>
                <p className="flex-1 text-zinc-300 font-normal">{point}</p>
              </div>
            ))}
          </div>
        </section>
        {/* Navigation Action */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-mono font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md"
          >
            Return to Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
};
