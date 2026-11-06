import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trash2, ArrowUpRight, Bookmark } from "lucide-react";
import { fetchSavedJobs, unsaveJob } from "./jobsApi";
import type { Job } from "./types";
import { Navbar } from "../../components/NavBar";
import { useLatestResumeId } from "../resume/useResumes";

const cleanSnippet = (raw: string): string => {
  if (!raw) return "";
  const textarea = document.createElement("textarea");
  textarea.innerHTML = raw;
  return textarea.value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
};

export const SavedJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resumeId = useLatestResumeId();

  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const results = await fetchSavedJobs();
        setJobs(results);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load saved jobs.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadSavedJobs();
  }, []);

  const handleRemove = async (jobId: string) => {
    try {
      await unsaveJob(jobId);
      setJobs((current) => current.filter((job) => job.id !== jobId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to remove saved job.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Shortlisted Roles
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Saved Jobs
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Roles bookmarked from the job board for requirement matching and
              interview practice.
            </p>
          </div>
          <Link
            to="/jobs"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            Explore jobs
          </Link>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <Bookmark className="mx-auto h-7 w-7 text-slate-400" />
            <h2 className="mt-3 text-base font-semibold text-slate-900">
              No saved jobs yet
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Save roles from the Explore Jobs page to compare requirements and
              practice interviews.
            </p>
            <Link
              to="/jobs"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              Explore verified jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {job.source}
                      </span>
                      {job.isActive && (
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 text-lg font-semibold text-slate-900">
                      {job.title}
                    </h2>

                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-800">
                        {job.company}
                      </span>
                      {job.location && (
                        <>
                          <span>·</span>
                          <span>{job.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/matches/${job.id}${
                        resumeId ? `?resumeId=${resumeId}` : ""
                      }`}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <span>View match</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>

                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <span>Apply</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleRemove(job.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
                  {cleanSnippet(job.description)}...
                </p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedJobsPage;
