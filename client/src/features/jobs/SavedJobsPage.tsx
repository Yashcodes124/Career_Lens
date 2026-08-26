import React, { useEffect, useState } from "react";
import { fetchSavedJobs, unsaveJob } from "./jobsApi";
import type { Job } from "./types";
import { Navbar } from "@/components/NavBar";

export const SavedJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <>
      <Navbar />

      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-indigo-300">
              Career Lens
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
              Saved Jobs
            </h1>

            <p className="mt-2 text-slate-400">Jobs you've saved for later.</p>
          </header>

          {error && (
            <div className="mb-6 rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
              Loading saved jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-200">
                No saved jobs yet
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Save interesting jobs from the job board and they will appear
                here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">
                          Verified {job.source}
                        </span>

                        {job.isActive && (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                            Active
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 text-xl font-semibold text-white">
                        {job.title}
                      </h2>

                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-400">
                        <span>{job.company}</span>

                        {job.location && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span>{job.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                        >
                          Apply
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => void handleRemove(job.id)}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-400">
                    {job.description.replace(/<[^>]+>/g, " ").slice(0, 240)}
                    {job.description.length > 240 ? "..." : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SavedJobsPage;
