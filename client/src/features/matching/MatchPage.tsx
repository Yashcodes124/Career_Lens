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
  const activeResume =
    resumes?.find((r) => r.id === queryResumeId) ?? resumes?.[0] ?? null;
  const activeResumeId = activeResume?.id ?? null;

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Explore Jobs</span>
          </Link>
        </div>

        {loading || resumesLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-600">
              Comparing your resume skills against this role’s requirements...
            </p>
          </div>
        ) : !activeResumeId ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Resume required for job matching
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Upload your resume to see which skills match this role.
            </p>
            <Link
              to="/resume"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              Upload resume
            </Link>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            <p className="font-semibold text-red-900">
              Unable to compute match
            </p>
            <p className="mt-1">{error}</p>
          </div>
        ) : result ? (
          <>
            <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Match Analysis
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Requirement Coverage & Skill Gaps
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Compared using{" "}
                  <strong className="font-medium text-slate-800">
                    {activeResume?.fileName ??
                      activeResume?.title ??
                      "your active resume"}
                  </strong>{" "}
                  on {new Date().toLocaleDateString()}.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Link
                  to={`/skill-gaps/${jobId}?resumeId=${activeResumeId}`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  Practice targeted interview
                </Link>
                <Link
                  to={`/tailor/${jobId}?resumeId=${activeResumeId}`}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Tailor application
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
