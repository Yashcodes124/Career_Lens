import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight, Briefcase } from "lucide-react";
import { Navbar } from "../../components/NavBar";
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
    void loadOrGenerate();
  }, [interviewId]);

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex min-h-[70vh] flex-col items-center justify-center font-mono text-sm text-zinc-400">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-400" />
          <p>
            {generating
              ? "Synthesizing rubric evaluation & updating your closed-loop skill profile..."
              : "Retrieving session analytics..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-[#161b22] p-6 text-center font-mono">
            <p className="mb-4 text-sm text-red-400">
              {error || "Evaluation report unavailable."}
            </p>
            <button
              onClick={() => void loadOrGenerate()}
              className="w-full rounded border border-red-500/40 bg-red-950/60 py-2 text-xs text-red-200 transition hover:bg-red-900/80"
            >
              Retry Generation
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { score, feedback, breakdown } = evaluation;

  const feedbackPoints = feedback
    .split(/(?<=\.)\s+/)
    .filter((sentence) => sentence.trim().length > 0);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-zinc-200 selection:bg-zinc-800">
      <Navbar />

      <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
        {/* Closed-Loop Update Banner */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-xs text-teal-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-teal-400" />
            <span>
              <strong>Closed-Loop Profile Updated:</strong> Strengths and focus
              areas from this session have been synced to your Dashboard
              Readiness Profile.
            </span>
          </div>
        </div>

        {/* 1. Header / Score Banner */}
        <header className="flex flex-col items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-[#161b22] p-6 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs font-medium text-emerald-400">
                Session Final Assessment
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
              {interview?.title || "Mock Interview Report"}
            </h1>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-[#0d1117] px-6 py-3 text-right">
            <span className="font-mono text-3xl font-bold text-emerald-400">
              {score}/100
            </span>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
              Overall Readiness Score
            </p>
          </div>
        </header>

        {/* 2. Competency Metrics */}
        <section className="space-y-4 rounded-xl border border-zinc-800 bg-[#161b22] p-6">
          <h2 className="border-b border-zinc-800 pb-3 font-mono text-xs text-zinc-400">
            // Competency Breakdown
          </h2>
          <div className="grid grid-cols-2 gap-3 font-mono md:grid-cols-5">
            {[
              { label: "Technical", val: breakdown.technicalKnowledge },
              { label: "Problem Solving", val: breakdown.problemSolving },
              { label: "Communication", val: breakdown.communication },
              { label: "Relevance", val: breakdown.relevance },
              { label: "Confidence", val: breakdown.confidence },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-zinc-800/80 bg-[#0d1117] p-3.5 text-center"
              >
                <span className="block text-xl font-bold text-zinc-100">
                  {item.val}
                </span>
                <span className="text-[10px] text-zinc-500">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Strengths & Focus Areas */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="space-y-4 rounded-xl border border-emerald-500/20 bg-[#161b22] p-6">
            <h3 className="border-b border-emerald-500/20 pb-2 font-mono text-xs font-bold text-emerald-400">
              [+] Demonstrated Strengths (Marked STRONG)
            </h3>
            <div className="space-y-2">
              {breakdown.strengths.map((str, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 rounded-lg border border-emerald-500/10 bg-[#0d1117]/60 p-2.5 text-xs text-zinc-300"
                >
                  <span className="font-mono text-sm leading-none text-emerald-400">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="leading-relaxed">{str}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-amber-500/20 bg-[#161b22] p-6">
            <h3 className="border-b border-amber-500/20 pb-2 font-mono text-xs font-bold text-amber-400">
              [-] Priority Focus Areas (Flagged WEAK for Next Prep)
            </h3>
            <div className="space-y-2">
              {breakdown.improvements.map((imp, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 rounded-lg border border-amber-500/10 bg-[#0d1117]/60 p-2.5 text-xs text-zinc-300"
                >
                  <span className="font-mono text-sm leading-none text-amber-400">
                    !
                  </span>
                  <span className="leading-relaxed">{imp}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 4. Overall Recommendation & Synthesis */}
        <section className="space-y-5 rounded-xl border border-zinc-800 bg-[#161b22] p-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-100">
              Overall Recommendation & Synthesis
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Overall summary of performance, system trade-offs, and hiring
              suitability
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="font-sans text-xs leading-relaxed text-amber-300">
              <span className="mr-2 font-mono font-bold text-amber-400">
                {breakdown.recommendation} —
              </span>
              {feedback}
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {feedbackPoints.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-3 rounded-lg border border-zinc-800/80 bg-[#0d1117] p-4 text-xs leading-relaxed text-zinc-300"
              >
                <span className="select-none pt-0.5 font-mono text-xs font-bold text-emerald-400">
                  0{idx + 1}.
                </span>
                <p className="flex-1 font-normal text-zinc-300">{point}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation Actions */}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-[#161b22] px-5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-600"
          >
            <Briefcase className="h-3.5 w-3.5 text-teal-400" />
            <span>Explore More Jobs</span>
          </Link>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 font-mono text-xs font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
