import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Sparkles,
  Layers,
  Filter,
  RotateCcw,
  BarChart3,
  Building2,
  Clock,
} from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { fetchJobs, fetchSavedJobs, unsaveJob, saveJob } from "./jobsApi";
import { JobCard } from "./JobCard";
import type { Job } from "./types";
import { createApplication } from "../tracker/trackerApi";
import { useLatestResumeId } from "../resume/useResumes";

const PAGE_SIZE = 30;

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const resumeId = useLatestResumeId();

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [results, savedJobs] = await Promise.all([
          fetchJobs(),
          fetchSavedJobs().catch(() => []),
        ]);

        setJobs(results);
        if (results.length > 0 && !selectedJobId) {
          setSelectedJobId(results[0].id);
        }
        setSavedJobIds(new Set(savedJobs.map((job) => job.id)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load jobs.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadJobs();
  }, []);

  const sources = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.source) set.add(j.source.toUpperCase());
    });
    return ["ALL", ...Array.from(set)];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedLocation = locationFilter.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !normalizedSearch ||
        job.title.toLowerCase().includes(normalizedSearch) ||
        job.company.toLowerCase().includes(normalizedSearch) ||
        job.requirements?.some((r) =>
          r.toLowerCase().includes(normalizedSearch),
        );

      const matchesLocation =
        !normalizedLocation ||
        job.location?.toLowerCase().includes(normalizedLocation);

      const matchesSource =
        sourceFilter === "ALL" || job.source?.toUpperCase() === sourceFilter;

      return matchesSearch && matchesLocation && matchesSource;
    });
  }, [jobs, search, locationFilter, sourceFilter]);

  const visibleJobs = useMemo(
    () => filteredJobs.slice(0, visibleCount),
    [filteredJobs, visibleCount],
  );

  const selectedJob = useMemo(
    () =>
      filteredJobs.find((job) => job.id === selectedJobId) ??
      filteredJobs[0] ??
      null,
    [filteredJobs, selectedJobId],
  );

  const handleToggleSave = async () => {
    if (!selectedJob || isSaving) return;

    try {
      setIsSaving(true);
      const isSaved = savedJobIds.has(selectedJob.id);

      if (isSaved) {
        await unsaveJob(selectedJob.id);
        setSavedJobIds((current) => {
          const next = new Set(current);
          next.delete(selectedJob.id);
          return next;
        });
      } else {
        await saveJob(selectedJob.id);
        setSavedJobIds((current) => {
          const next = new Set(current);
          next.add(selectedJob.id);
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to update saved job:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrackApplication = async () => {
    if (!selectedJob || isTracking) return;
    try {
      setIsTracking(true);
      await createApplication(selectedJob.id);
      navigate("/applications");
    } catch (err) {
      console.error("Failed to track application:", err);
    } finally {
      setIsTracking(false);
    }
  };

  const decodeHtml = (html: string) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = html;
    return textarea.value;
  };

  const formatLastSynced = (date?: string) => {
    if (!date) return "Recently synced";
    try {
      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(date));
    } catch {
      return "Recently synced";
    }
  };

  const matchUrl = selectedJob
    ? `/matches/${selectedJob.id}${resumeId ? `?resumeId=${resumeId}` : ""}`
    : "/jobs";

  const skillGapUrl = selectedJob
    ? `/skill-gap/${selectedJob.id}${resumeId ? `?resumeId=${resumeId}` : ""}`
    : "/jobs";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Page Header */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-teal-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Sourced from Official Company ATS</span>
            </div>
            <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Verified Job Discovery
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Select a role to inspect deterministic skill overlap, missing
              gaps, and launch a targeted mock interview.
            </p>
          </div>

          <Link
            to="/saved-jobs"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-teal-500/40 hover:text-white"
          >
            <BookmarkCheck className="h-4 w-4 text-teal-400" />
            <span>Saved Jobs ({savedJobIds.size})</span>
          </Link>
        </header>

        {/* Filter Bar */}
        <div className="mb-6 grid gap-3 rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 md:grid-cols-[1.5fr_1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search role title, company, or skill..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-500"
            />
          </div>

          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={locationFilter}
              onChange={(event) => {
                setLocationFilter(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Filter by location (e.g. Remote, Bengaluru)..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-500"
            />
          </div>

          {sources.length > 2 && (
            <div className="relative flex items-center">
              <Filter className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-500" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                aria-label="Filter by ATS source"
                className="h-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-8 py-2.5 text-xs font-medium text-slate-200 outline-none focus:border-teal-500"
              >
                {sources.map((src) => (
                  <option key={src} value={src}>
                    {src === "ALL" ? "All ATS Sources" : src}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setLocationFilter("");
              setSourceFilter("ALL");
              setVisibleCount(PAGE_SIZE);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
          <p>
            Showing{" "}
            <span className="font-semibold text-white">
              {filteredJobs.length}
            </span>{" "}
            {filteredJobs.length === 1 ? "verified role" : "verified roles"}
          </p>
          {!resumeId && (
            <Link
              to="/resume"
              className="text-teal-400 underline-offset-4 hover:underline"
            >
              Upload a resume to unlock instant Match % scores →
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr]">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
                />
              ))}
            </div>
            <div className="h-[540px] animate-pulse rounded-3xl border border-slate-800 bg-slate-900/60" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-400">
            No jobs available right now.
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-12 text-center text-slate-400">
            No jobs match your current filters.
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1.35fr]">
            {/* Left Feed List */}
            <div className="space-y-3.5 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-2">
              {visibleJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  resumeId={resumeId}
                  isSelected={selectedJob?.id === job.id}
                  onSelect={(selected) => setSelectedJobId(selected.id)}
                />
              ))}

              {visibleCount < filteredJobs.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 text-xs font-semibold text-teal-300 transition hover:border-teal-500/40 hover:bg-slate-800"
                >
                  Load more roles ({filteredJobs.length - visibleCount}{" "}
                  remaining)
                </button>
              )}
            </div>

            {/* Right Sticky Detail & Readiness Action Pane */}
            <aside className="rounded-3xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-xl lg:sticky lg:top-20 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
              {selectedJob ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-teal-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified {selectedJob.source}
                      </span>
                      <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                        {selectedJob.title}
                      </h2>
                    </div>
                    {selectedJob.isActive !== false && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-300">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-1.5 font-medium text-white">
                      <Building2 className="h-4 w-4 text-teal-400" />
                      {selectedJob.company}
                    </span>
                    {selectedJob.location && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {selectedJob.location}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      Last verified:{" "}
                      {formatLastSynced(selectedJob.lastSyncedAt)}
                    </span>
                    <span>Source: {selectedJob.source}</span>
                  </div>

                  {selectedJob.salaryRange && (
                    <p className="mt-3 inline-block rounded-lg border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-200">
                      {selectedJob.salaryRange}
                    </p>
                  )}

                  {/* Closed-Loop Readiness Actions */}
                  <div className="mt-5 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-950 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                      Closed-Loop Readiness Actions
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Compare your resume against this role’s requirements to
                      see matched skills, priority gaps, and start a
                      role-specific AI mock interview.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      <Link
                        to={matchUrl}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-teal-400"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Analyze Match & Start Prep</span>
                      </Link>
                      <Link
                        to={skillGapUrl}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3.5 py-2.5 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/20"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span>Skill Gaps</span>
                      </Link>
                    </div>
                  </div>

                  {/* Secondary Job Actions */}
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {selectedJob.url && (
                      <a
                        href={selectedJob.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-center text-xs font-semibold text-white transition hover:border-teal-500/40 hover:bg-slate-800"
                      >
                        <span>Apply on Official ATS</span>
                        <ExternalLink className="h-3.5 w-3.5 text-teal-400" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => void handleToggleSave()}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-teal-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savedJobIds.has(selectedJob.id) ? (
                        <BookmarkCheck className="h-3.5 w-3.5 text-teal-400" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5" />
                      )}
                      {isSaving
                        ? "Saving..."
                        : savedJobIds.has(selectedJob.id)
                          ? "Saved"
                          : "Save Job"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleTrackApplication()}
                      disabled={isTracking}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-teal-600 hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Layers className="h-3.5 w-3.5 text-teal-400" />
                      {isTracking ? "Tracking..." : "Track Application"}
                    </button>
                  </div>

                  {/* Extracted Requirements */}
                  {selectedJob.requirements.length > 0 && (
                    <div className="mt-6 border-t border-slate-800 pt-5">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                        Required Skills & Qualifications
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedJob.requirements.map((req) => (
                          <span
                            key={req}
                            className="rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-200"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Job Description */}
                  <div className="mt-6 border-t border-slate-800 pt-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                      Job Description
                    </h3>
                    <div
                      className="prose prose-invert mt-4 max-w-none text-sm leading-7 prose-headings:text-slate-100 prose-p:text-slate-300 prose-li:text-slate-300"
                      dangerouslySetInnerHTML={{
                        __html: decodeHtml(selectedJob.description),
                      }}
                    />
                  </div>
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
