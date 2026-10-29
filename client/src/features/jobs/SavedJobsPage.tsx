import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trash2, ArrowUpRight } from "lucide-react";
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-teal-400">
              Shortlisted Roles
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Saved Jobs
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Roles bookmarked from the verified job board for matching and
              interview prep.
            </p>
          </div>
          <Link
            to="/jobs"
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:text-white"
          >
            Browse Job Board
          </Link>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-xs text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-32 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center">
            <h2 className="text-base font-semibold text-zinc-200">
              No saved jobs yet
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Save interesting roles from the job board and they will appear
              here.
            </p>
            <Link
              to="/jobs"
              className="mt-4 inline-block rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-teal-400"
            >
              Explore Verified Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition hover:border-zinc-700"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                        Verified {job.source}
                      </span>
                      {job.isActive && (
                        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                          Active
                        </span>
                      )}
                    </div>

                    <h2 className="mt-1.5 text-lg font-semibold text-white">
                      {job.title}
                    </h2>

                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                      <span className="font-medium text-zinc-200">
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
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400"
                    >
                      <span>Match & Prep</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>

                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 hover:text-white"
                      >
                        <span>Apply</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleRemove(job.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-[#09090b] px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-red-500/40 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-zinc-400">
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
