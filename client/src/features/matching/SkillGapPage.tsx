import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { calculateJobMatch } from "./matchingApi";
import type { MatchResponseData } from "./types";
import MatchResult from "./MatchResult";
import { useResumes } from "../resume/useResumes";
import { createInterview } from "../interview/interviewApi";
import {
  InterviewConfig,
  PreInterviewModal,
} from "../interview/PreInterviewModal";

export const SkillGapPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    data: resumes,
    isLoading: resumesLoading,
    isError: resumesError,
  } = useResumes();

  const resumeId = searchParams.get("resumeId") ?? resumes?.[0]?.id ?? null;

  const [data, setData] = useState<MatchResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || !resumeId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    calculateJobMatch({ resumeId, jobId })
      .then((response) => {
        if (!cancelled) setData(response.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load skill gaps",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jobId, resumeId, attempt]);

  const handleStartInterview = async (config: InterviewConfig) => {
    if (!data?.applicationId || isStartingInterview) return;
    setStartError(null);
    setIsStartingInterview(true);
    try {
      const interview = await createInterview({
        applicationId: data.applicationId,
        durationMinutes: config.durationMinutes,
        difficulty: config.difficulty,
        focusTopics: config.focusTopics,
      });
      setIsModalOpen(false);
      navigate(`/interviews/${interview.id}/prep`, {
        state: {
          durationMinutes: config.durationMinutes,
          difficulty: config.difficulty,
          focusTopics: config.focusTopics,
        },
      });
    } catch (err) {
      setStartError(
        err instanceof Error ? err.message : "Could not start the interview",
      );
      setIsModalOpen(false);
    } finally {
      setIsStartingInterview(false);
    }
  };

  if (!jobId) {
    return (
      <Shell>
        <p className="text-sm text-slate-600">
          Choose a job to view its skill gaps.
        </p>
        <Link
          to="/jobs"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Browse jobs
        </Link>
      </Shell>
    );
  }

  if (resumesLoading) {
    return (
      <Shell>
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-600">Loading your resume...</p>
        </div>
      </Shell>
    );
  }

  if (resumesError) {
    return (
      <Shell>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          We could not load your resumes. Check your connection and try again.
        </div>
      </Shell>
    );
  }

  if (!resumeId) {
    return (
      <Shell>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-600">
            Upload your resume to see which skills match this role.
          </p>
          <Link
            to="/resume"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
          >
            Upload resume
          </Link>
        </div>
      </Shell>
    );
  }

  const priorityGapNames = data?.skillGaps?.map((g) => g.skill) ?? [];
  const matchedSkillNames = data?.matchedSkills ?? [];
  const missingSkillNames = data?.missingSkills ?? [];

  return (
    <Shell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Preparation Plan
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Skill Gaps
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Focus on the skills that appear most often across your target roles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={!data || data.status !== "OK" || !data.applicationId}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Start practice interview</span>
          </button>
          <Link
            to={`/tailor/${jobId}?resumeId=${resumeId}`}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Tailor resume
          </Link>
          <Link
            to={`/matches/${jobId}?resumeId=${resumeId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to match</span>
          </Link>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-600">
            Analyzing your resume against this role’s requirements...
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            Try again
          </button>
        </div>
      )}

      {data && !loading && (
        <>
          <MatchResult result={data} />

          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50/70 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Practice these skill gaps in a targeted interview
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Configure your duration (15–60 min), difficulty, and focus
                skills ({priorityGapNames.length} gaps,{" "}
                {matchedSkillNames.length} matched) to practice before your real
                screen.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={data.status !== "OK" || !data.applicationId}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start practice interview</span>
            </button>
          </div>

          {startError && (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
            >
              {startError}
            </div>
          )}
        </>
      )}

      <PreInterviewModal
        isOpen={isModalOpen}
        onClose={() => !isStartingInterview && setIsModalOpen(false)}
        onStartInterview={handleStartInterview}
        priorityGaps={priorityGapNames}
        dynamicTopics={missingSkillNames}
        matchedSkills={matchedSkillNames}
        isStarting={isStartingInterview}
      />
    </Shell>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#f8fafc] text-slate-900">
    <Navbar />
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </main>
  </div>
);

export default SkillGapPage;
