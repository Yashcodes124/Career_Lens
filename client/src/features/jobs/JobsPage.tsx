import React, { useEffect, useMemo, useState } from "react";
import { fetchJobs, fetchSavedJobs, unsaveJob, saveJob } from "./jobsApi";
import { JobCard } from "./JobCard";
import type { Job } from "./types";
import { createApplication } from "../tracker/trackerApi";

export const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        //fetcing jobs
        const results = await fetchJobs();
        setJobs(results);
        if (results.length > 0 && !selectedJobId) {
          setSelectedJobId(results[0].id);
        }
        //saved jobs
        const savedJobs = await fetchSavedJobs();
        setSavedJobIds(new Set(savedJobs.map((job) => job.id)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load jobs.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadJobs();
  }, []);

  //Saved jobs toggle
  const handleToggleSave = async () => {
    if (!selectedJob || isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      const isSaved = savedJobIds.has(selectedJob.id);

      if (isSaved) {
        await unsaveJob(selectedJob.id);
        //unsave the selected job
        setSavedJobIds((current) => {
          const next = new Set(current);
          next.delete(selectedJob.id);
          return next;
        });
      } else {
        await saveJob(selectedJob.id);
        //save the selected job
        setSavedJobIds((current) => {
          const next = new Set(current);
          next.add(selectedJob.id);
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to update saved job:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrackApplication = async () => {
    //no job selected and nothing to track
    if (!selectedJob || isTracking) {
      return;
    }
    try {
      setIsTracking(true);

      await createApplication(selectedJob.id);

      window.location.href = "/applications";
    } catch (error) {
      console.error("Failed to track application:", error);
    } finally {
      setIsTracking(false);
    }
  };

  // match jobs by search and location filter
  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedLocation = locationFilter.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !normalizedSearch ||
        job.title.toLowerCase().includes(normalizedSearch) ||
        job.company.toLowerCase().includes(normalizedSearch);

      const matchesLocation =
        !normalizedLocation ||
        job.location?.toLowerCase().includes(normalizedLocation);

      return matchesSearch && matchesLocation;
    });
  }, [jobs, search, locationFilter]);

  // Select the job
  const selectedJob = useMemo(
    () =>
      filteredJobs.find((job) => job.id === selectedJobId) ??
      filteredJobs[0] ??
      null,
    [filteredJobs, selectedJobId],
  );

  const decodeHtml = (html: string) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = html;
    return textarea.value;
  };

  //Helper to convert ISO date string(from Db) to human readable format for users
  const formatLastSynced = (date?: string) => {
    //in case date field is missing | undefinedd then
    if (!date) return "Recently synced";

    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-indigo-300">
              Career Lens
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
              Job Board
            </h1>
          </div>
        </header>
        {/*        job Search by filter and location         */}
        <div className="mb-6 grid gap-3 md:grid-cols-[1.5fr_1fr_auto]">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search jobs or companies..."
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500"
          />

          <input
            type="text"
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            placeholder="Filter by location..."
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500"
          />

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setLocationFilter("");
            }}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900"
          >
            Clear
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}{" "}
          found
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/*         JobCard  Loading ...........     */}
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
            No jobs available right now.
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
            No jobs match for your current filters.
          </div>
        ) : (
          //JOB CARD
          <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr]">
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJobId === job.id}
                  onSelect={(selected) => setSelectedJobId(selected.id)}
                />
              ))}
            </div>

            <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
              {selectedJob ? (
                <>
                  {/* Source , Role and actiness */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                        Verified {selectedJob.source}
                      </span>
                      <h2 className="mt-3 text-3xl font-bold text-white">
                        {selectedJob.title}
                      </h2>
                    </div>
                    {selectedJob.isActive !== false && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                        Active
                      </span>
                    )}
                  </div>
                  {/* Job location */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                    <span>{selectedJob.company}</span>
                    {selectedJob.location && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span>{selectedJob.location}</span>
                      </>
                    )}
                  </div>
                  {/* Last Verified date and time */}
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>
                      Last verified:{" "}
                      {formatLastSynced(selectedJob.lastSyncedAt)}
                    </span>

                    <span>Source: {selectedJob.source}</span>
                  </div>

                  {/* Salary range for job role */}
                  {selectedJob.salaryRange && (
                    <p className="mt-4 text-sm text-indigo-200">
                      {selectedJob.salaryRange}
                    </p>
                  )}

                  {/* Job url or Job Posting */}
                  <div className="mt-3 flex gap-3">
                    {selectedJob.url && (
                      <a
                        href={selectedJob.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
                      >
                        Apply on verified company posting
                      </a>
                    )}
                    {/*  save Job */}
                    <button
                      type="button"
                      onClick={() => void handleToggleSave()}
                      disabled={isSaving}
                      className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-indigo-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving
                        ? "Saving..."
                        : savedJobIds.has(selectedJob.id)
                          ? "Saved"
                          : "Save Job"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleTrackApplication()}
                      className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-indigo-500 hover:bg-slate-800"
                    >
                      {isTracking ? "Tracking..." : "Track Application"}
                    </button>
                  </div>
                  {/* Job Description */}
                  <div className="mt-8 border-t border-slate-800 pt-6">
                    <h3 className="text-lg font-semibold text-white">
                      Job Description
                    </h3>
                    <div
                      className="prose prose-invert mt-5 max-w-none text-sm leading-7 prose-headings:text-slate-100 prose-p:text-slate-300 prose-li:text-slate-300"
                      dangerouslySetInnerHTML={{
                        __html: decodeHtml(selectedJob.description),
                      }}
                    />
                  </div>
                  {/* Job requirements */}
                  {selectedJob.requirements.length > 0 && (
                    <div className="mt-8 border-t border-slate-800 pt-6">
                      <h3 className="text-lg font-semibold text-white">
                        Requirements
                      </h3>
                      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
                        {selectedJob.requirements.map((req) => (
                          <li key={req}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-slate-400">
                  Select a job to view its details.
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
