import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  FileEdit,
  BarChart3,
  ArrowLeft,
  UploadCloud,
  Layers,
} from "lucide-react";
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-teal-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Verified Jobs</span>
          </Link>
        </div>

        {loading || resumesLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-teal-400" />
            <p className="mt-4 text-sm font-medium text-slate-300">
              Analyzing your resume against this job’s requirements...
            </p>
          </div>
        ) : !activeResumeId ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-10 text-center">
            <UploadCloud className="mx-auto h-10 w-10 text-teal-400" />
            <h2 className="mt-3 text-lg font-semibold text-white">
              Upload a resume to run deterministic matching
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              TrueHire compares your verified skills against the job description
              to compute your match score.
            </p>
            <Link
              to="/resume"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Resume</span>
            </Link>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-6 text-sm text-red-300">
            <p className="font-semibold text-red-200">
              Unable to compute match
            </p>
            <p className="mt-1">{error}</p>
          </div>
        ) : result ? (
          <>
            <header className="mb-8 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Deterministic Skill Matcher</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                  Skill Gap & Qualification Analysis
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Transparent overlap between your parsed resume skills and this
                  posting’s requirements.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Link
                  to={`/skill-gaps/${jobId}?resumeId=${activeResumeId}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-teal-400"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Open Skill Gap Plan</span>
                </Link>
                <Link
                  to={`/tailor/${jobId}?resumeId=${activeResumeId}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-teal-500/50 hover:text-white"
                >
                  <FileEdit className="h-4 w-4 text-teal-400" />
                  <span>Tailor Resume</span>
                </Link>
                <Link
                  to="/applications"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-teal-500/50 hover:text-white"
                >
                  <Layers className="h-4 w-4 text-teal-400" />
                  <span>View in Tracker</span>
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
