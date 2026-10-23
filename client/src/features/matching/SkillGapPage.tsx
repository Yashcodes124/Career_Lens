import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { calculateJobMatch } from "./matchingApi";
import type { MatchResponseData } from "./types";
import MatchResult from "./MatchResult";
import { useResumes } from "../resume/useResumes";
import { createInterview } from "../interview/interviewApi";
import { InterviewConfig, PreInterviewModal } from "../interview/PreInterviewModal";

export const SkillGapPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: resumes, isLoading: resumesLoading, isError: resumesError } = useResumes();

  // A resume chosen on the match page wins; otherwise use the newest resume.
  const resumeId = searchParams.get("resumeId") ?? resumes?.[0]?.id ?? null;

  const [data, setData] = useState<MatchResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
          setError(err instanceof Error ? err.message : "Could not load skill gaps");
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
    if (!data?.applicationId) return;
    setIsModalOpen(false);
    setStartError(null);
    try {
      const interview = await createInterview({
        applicationId: data.applicationId,
        durationMinutes: config.durationMinutes,
        difficulty: config.difficulty,
        focusTopics: config.focusTopics,
      });
      navigate(`/interviews/${interview.id}/prep`);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Could not start the interview");
    }
  };

  if (!jobId) {
    return (
      <Shell>
        <p className="text-gray-400">Choose a job to see its skill gaps.</p>
        <Link to="/jobs" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300">
          Browse jobs
        </Link>
      </Shell>
    );
  }

  if (resumesLoading) {
    return <Shell><p className="text-gray-400">Loading your resumes...</p></Shell>;
  }

  if (resumesError) {
    return (
      <Shell>
        <p className="text-red-400">We could not load your resumes. Check your connection and try again.</p>
      </Shell>
    );
  }

  if (!resumeId) {
    return (
      <Shell>
        <p className="text-gray-400">Upload a resume to see how it compares with this job.</p>
        <Link to="/resume" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300">
          Upload a resume
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">Skill gap plan</p>
          <h1 className="mt-2 text-3xl font-bold text-white">What to improve for this job</h1>
        </div>
        <Link
          to={`/matches/${jobId}?resumeId=${resumeId}`}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Back to match details
        </Link>
      </div>

      {loading && <p className="text-gray-400">Analyzing your resume against this job...</p>}

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-3 rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Try again
          </button>
        </div>
      )}

      {data && !loading && (
        <>
          <MatchResult result={data} />

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-800 bg-gray-900 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-400">
              Practise the gaps above with a mock interview built for this role.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={data.status !== "OK" || !data.applicationId}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start mock interview
            </button>
          </div>
          {startError && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {startError}
            </p>
          )}
        </>
      )}

      <PreInterviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartInterview={handleStartInterview}
      />
    </Shell>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="min-h-screen bg-gray-950 p-6">
    <div className="mx-auto max-w-5xl">{children}</div>
  </main>
);

export default SkillGapPage;
