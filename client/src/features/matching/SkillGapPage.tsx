import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
        <p className="text-sm text-zinc-400">
          Choose a job to see its skill gaps.
        </p>
        <Link
          to="/jobs"
          className="mt-4 inline-block text-sm text-teal-400 hover:text-teal-300"
        >
          Browse jobs
        </Link>
      </Shell>
    );
  }

  if (resumesLoading) {
    return (
      <Shell>
        <p className="font-mono text-xs text-zinc-400">
          Loading your resumes...
        </p>
      </Shell>
    );
  }

  if (resumesError) {
    return (
      <Shell>
        <p className="text-sm text-red-400">
          We could not load your resumes. Check your connection and try again.
        </p>
      </Shell>
    );
  }

  if (!resumeId) {
    return (
      <Shell>
        <p className="text-sm text-zinc-400">
          Upload a resume to see how it compares with this job.
        </p>
        <Link
          to="/resume"
          className="mt-4 inline-block rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-teal-400"
        >
          Upload a resume
        </Link>
      </Shell>
    );
  }

  const priorityGapNames = data?.skillGaps?.map((g) => g.skill) ?? [];
  const matchedSkillNames = data?.matchedSkills ?? [];
  const missingSkillNames = data?.missingSkills ?? [];

  return (
    <Shell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-teal-400">
            Skill gap plan
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            What to improve for this job
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={`/tailor/${jobId}?resumeId=${resumeId}`}
            className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3.5 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:text-white"
          >
            Tailor resume
          </Link>
          <Link
            to={`/matches/${jobId}?resumeId=${resumeId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to match details</span>
          </Link>
        </div>
      </div>

      {loading && (
        <p className="font-mono text-xs text-zinc-400">
          Analyzing your resume against this job...
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-sm text-red-300"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-3 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
          >
            Try again
          </button>
        </div>
      )}

      {data && !loading && (
        <>
          <MatchResult result={data} />

          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Practise the job skills & gaps above
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Choose specific skills from this job ({priorityGapNames.length}{" "}
                gaps, {matchedSkillNames.length} matched), set your duration and
                difficulty, and launch a custom mock interview.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={data.status !== "OK" || !data.applicationId}
              className="shrink-0 rounded-lg bg-teal-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start mock interview
            </button>
          </div>

          {startError && (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-red-500/30 bg-red-950/20 p-3.5 text-xs text-red-300"
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
  <div className="min-h-screen bg-[#09090b] text-zinc-100">
    <Navbar />
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
  </div>
);

export default SkillGapPage;
