import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { calculateJobMatch } from "./matchingApi";
import type { MatchResult as MatchResultType } from "./types";
import MatchResult from "./MatchResult";

export default function MatchPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();

  const resumeId = searchParams.get("resumeId");

  const [result, setResult] = useState<MatchResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || !resumeId) {
      setError("Resume and job are required.");
      setLoading(false);
      return;
    }

    const runMatch = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await calculateJobMatch({
          resumeId,
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

    runMatch();
  }, [jobId, resumeId]);

  if (loading) {
    return (
      <div className="p-8 text-gray-400">
        Analyzing your resume against this job...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm text-gray-400">Resume Matcher</p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Skill Gap & Qualification Analysis
          </h1>

          <p className="mt-2 text-gray-400">
            Deterministic analysis based on your resume skills and the job
            requirements.
          </p>
        </div>

        <MatchResult result={result} />
      </div>
    </main>
  );
}
