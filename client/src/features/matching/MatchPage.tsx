import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { calculateJobMatch } from "./matchingApi";
import type { MatchResult as MatchResultType } from "./types";
import MatchResult from "./MatchResult";
import { useResumes } from "../resume/useResumes";

export default function MatchPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const queryResumeId = searchParams.get("resumeId");

  const { data: resumes, isLoading: resumesLoading } = useResumes();
  const activeResumeId = queryResumeId || resumes?.[0]?.id || null;

  const [result, setResult] = useState<MatchResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resumesLoading) return;

    if (!jobId) {
      setError("Job identifier is missing.");
      setLoading(false);
      return;
    }

    if (!activeResumeId) {
      setLoading(false);
      return;
    }

    const runMatch = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await calculateJobMatch({
          resumeId: activeResumeId,
          jobId,
        });

        setResult(response.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to calculate match",
        );
      } finally {
        setLoading(false);
      }
    };

    void runMatch();
  }, [jobId, activeResumeId, resumesLoading]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-teal-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Verified Jobs</span>
          </Link>
        </div>

        {loading || resumesLoading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-10 text-center">
            <p className="font-mono text-xs text-zinc-400">
              Analyzing your resume against this job...
            </p>
          </div>
        ) : !activeResumeId ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center">
            <h2 className="text-base font-semibold text-white">
              Resume required for deterministic matching
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Upload a PDF or DOCX resume to compare your skills with this
              posting.
            </p>
            <Link
              to="/resume"
              className="mt-4 inline-block rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-teal-400"
            >
              Upload Resume
            </Link>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-sm text-red-300">
            <p className="font-semibold text-red-200">
              Unable to compute match
            </p>
            <p className="mt-1">{error}</p>
          </div>
        ) : result ? (
          <>
            <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-teal-400">
                  Resume Matcher
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Skill Gap & Qualification Analysis
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Deterministic analysis based on your resume skills and the job
                  requirements.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Link
                  to={`/skill-gaps/${jobId}?resumeId=${activeResumeId}`}
                  className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98]"
                >
                  Open skill gap plan & interview
                </Link>
                <Link
                  to={`/tailor/${jobId}?resumeId=${activeResumeId}`}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:text-white"
                >
                  Tailor resume
                </Link>
              </div>
            </header>

            <MatchResult result={result} />
          </>
        ) : null}
      </main>
    </div>
  );
}
