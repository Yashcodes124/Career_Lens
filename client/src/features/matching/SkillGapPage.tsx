//SkillGapPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  Target,
  Sparkles,
  Play,
} from "lucide-react";
import { createInterview } from "../interview/interviewApi";
import {
  PreInterviewModal,
  InterviewConfig,
} from "../interview/PreInterviewModal";
import { calculateJobMatch } from "./matchingApi";

export const SkillGapPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const getPriorityBadge = (priority: "HIGH" | "MEDIUM" | "LOW") => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "LOW":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const loadData = async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      setError(null);

      //(GET /skill-gap/:jobId )resume id from Storage or User logged-in state
      const storedResumeId = localStorage.getItem("resumeId") || "";
      //get the SkillGap details
      const result = await calculateJobMatch({
        resumeId: storedResumeId,
        jobId,
      });
      setData(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load skill gap data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-zinc-400 font-mono text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Loading Skill Gap Analysis...</span>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-red-500/30 rounded-lg p-6 font-mono">
          <p className="text-red-400 text-sm mb-4">
            {error || "Skill gap data not found."}
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

  const prepTopicsFromGaps =
    data.missingSkills?.flatMap((item: any) => item.prepTopics || []) || [];

  const handleStartInterview = async (config: InterviewConfig) => {
    try {
      setIsModalOpen(false);
      setError(null);

      const interview = await createInterview({
        applicationId: data.applicationId,
        durationMinutes: config.durationMinutes,
        difficulty: config.difficulty,
        focusTopics: config.focusTopics,
      });

      navigate(`/interviews/${interview.id}/prep`, {
        state: {
          durationMinutes: config.durationMinutes,
          difficulty: config.difficulty,
          focusTopics: config.focusTopics,
          roleTitle: data.roleTitle,
        },
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to initialize interview session",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              <Target className="w-4 h-4" /> Skill Gap Analysis
            </div>
            <h1 className="text-2xl font-bold">{data.roleTitle}</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-400">Match Readiness</div>
                <div className="text-2xl font-extrabold text-indigo-400">
                  {data.matchScore}%
                </div>
              </div>
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                  style={{ width: `${data.matchScore}%` }}
                />
              </div>
            </div>

            {/* Test Trigger Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Practice Mock Interview
            </button>
          </div>
        </div>

        {/* Coverage Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matched Skills */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Verified Skills (
              {data.matchedSkills.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.matchedSkills.map((skill: any) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skills Count */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Skill Gaps Identified (
              {data.missingSkills.length})
            </h2>
            <p className="text-xs text-slate-400">
              Focusing on high-priority gaps will significantly increase your
              interview conversion rate for this role.
            </p>
          </div>
        </div>

        {/* Detailed Skill Gap Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200">
            Recommended Focus Areas
          </h2>
          {data.missingSkills.map((item: any) => (
            <div
              key={item.skill}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <h3 className="text-base font-bold text-slate-100">
                    {item.skill}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getPriorityBadge(item.priority)}`}
                >
                  {item.priority} PRIORITY
                </span>
              </div>

              <p className="text-xs text-slate-400 pl-8">{item.reason}</p>

              <div className="pl-8 pt-2">
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />{" "}
                  Preparation Topics:
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.prepTopics.map((topic: any) => (
                    <span
                      key={topic}
                      className="px-3 py-1 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pre-Interview Modal */}
      <PreInterviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartInterview={handleStartInterview}
        jobTitle={data.roleTitle}
        dynamicTopics={prepTopicsFromGaps}
      />
    </div>
  );
};
