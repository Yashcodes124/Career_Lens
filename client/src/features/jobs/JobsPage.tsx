import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  RotateCcw,
  Building2,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { fetchJobs, fetchSavedJobs, unsaveJob, saveJob } from "./jobsApi";
import { JobCard } from "./JobCard";
import type { Job } from "./types";
import { createApplication } from "../tracker/trackerApi";
import { useLatestResumeId } from "../resume/useResumes";

const JOBS_PER_PAGE = 12;

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeDrawerJob, setActiveDrawerJob] = useState<Job | null>(null);
  const [drawerTab, setDrawerTab] = useState<"OVERVIEW" | "DESCRIPTION">(
    "OVERVIEW",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

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
        setSavedJobIds(new Set(savedJobs.map((job) => job.id)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load jobs.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadJobs();
  }, []);

  // Compute the most common role titles/categories dynamically from the loaded job list
  const commonRoleTitles = useMemo(() => {
    const counts = new Map<string, number>();

    const normalizeRoleTitle = (rawTitle: string): string => {
      const cleaned = rawTitle
        .split(/[-–—,|/()]/)[0]
        .replace(
          /\b(Sr\.?|Senior|Jr\.?|Junior|Staff|Principal|Lead|I|II|III|IV)\b/gi,
          "",
        )
        .replace(/\s+/g, " ")
        .trim();
      return cleaned.length > 3 && cleaned.length <= 36
        ? cleaned
        : rawTitle.slice(0, 30);
    };

    jobs.forEach((job) => {
      const role = normalizeRoleTitle(job.title);
      if (role) {
        counts.set(role, (counts.get(role) ?? 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([title, count]) => ({ title, count }));
  }, [jobs]);

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
        (normalizedLocation === "india"
          ? /india|bengaluru|bangalore|hyderabad|pune|mumbai|gurgaon|gurugram|noida|chennai|delhi/i.test(
              job.location ?? "",
            )
          : job.location?.toLowerCase().includes(normalizedLocation));

      const matchesSource =
        sourceFilter === "ALL" || job.source?.toUpperCase() === sourceFilter;

      return matchesSearch && matchesLocation && matchesSource;
    });
  }, [jobs, search, locationFilter, sourceFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredJobs.length / JOBS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedJobs = useMemo(() => {
    const start = (safePage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [filteredJobs, safePage]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  const handleToggleSave = async (job: Job) => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      const isSaved = savedJobIds.has(job.id);
      if (isSaved) {
        await unsaveJob(job.id);
        setSavedJobIds((current) => {
          const next = new Set(current);
          next.delete(job.id);
          return next;
        });
      } else {
        await saveJob(job.id);
        setSavedJobIds((current) => {
          const next = new Set(current);
          next.add(job.id);
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to update saved job:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrackApplication = async (job: Job) => {
    if (isTracking) return;
    try {
      setIsTracking(true);
      await createApplication(job.id);
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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-teal-400">
              Verified ATS Directory
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Job Board
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Browse verified listings by common role titles or location. Click
              any role to inspect skills or launch a mock interview.
            </p>
          </div>

          <Link
            to="/saved-jobs"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:text-white"
          >
            <BookmarkCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>Saved ({savedJobIds.size})</span>
          </Link>
        </header>

        {/* Search & Location Filter Bar */}
        <div className="mb-4 grid gap-3 rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-3.5 md:grid-cols-[1.5fr_1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search role title, company, or skill..."
              className="w-full rounded-lg border border-zinc-800 bg-[#09090b] pl-10 pr-4 py-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-teal-500"
            />
          </div>

          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={locationFilter}
              onChange={(event) => {
                setLocationFilter(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter location (e.g., India, Bengaluru, Remote)..."
              className="w-full rounded-lg border border-zinc-800 bg-[#09090b] pl-10 pr-4 py-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-teal-500"
            />
          </div>

          {sources.length > 2 && (
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by ATS source"
              className="rounded-lg border border-zinc-800 bg-[#09090b] px-3 py-2 font-mono text-xs text-zinc-300 outline-none focus:border-teal-500"
            >
              {sources.map((src) => (
                <option key={src} value={src}>
                  {src === "ALL" ? "All Sources" : src}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setLocationFilter("");
              setSourceFilter("ALL");
              setCurrentPage(1);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-[#09090b] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Quick Region & Most Common Job Titles Bar */}
        {commonRoleTitles.length > 0 && (
          <div className="mb-6 space-y-2.5 rounded-xl border border-zinc-800/70 bg-zinc-900/20 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                Most Common Titles & Regions
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { label: "All Regions", val: "" },
                  { label: "India Hubs", val: "India" },
                  { label: "Bengaluru", val: "Bengaluru" },
                  { label: "Remote", val: "Remote" },
                ].map((loc) => {
                  const active =
                    locationFilter.toLowerCase() === loc.val.toLowerCase();
                  return (
                    <button
                      key={loc.label}
                      type="button"
                      onClick={() => {
                        setLocationFilter(loc.val);
                        setCurrentPage(1);
                      }}
                      className={`rounded border px-2 py-0.5 font-mono text-[10px] transition ${
                        active
                          ? "border-teal-500/50 bg-teal-500/15 text-teal-300"
                          : "border-zinc-800 bg-[#09090b] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {loc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {commonRoleTitles.map(({ title, count }) => {
                const isSelected =
                  search.trim().toLowerCase() === title.toLowerCase();
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => {
                      setSearch(isSelected ? "" : title);
                      setCurrentPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition ${
                      isSelected
                        ? "border-teal-500/60 bg-teal-500/15 font-medium text-teal-200"
                        : "border-zinc-800/90 bg-[#09090b] text-zinc-300 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    <span className="truncate max-w-[200px]">{title}</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.2 font-mono text-[10px] text-zinc-400 tabular-nums">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
          <p className="font-mono tabular-nums">
            {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}{" "}
            found · Page {safePage} of {totalPages}
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
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-40 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center text-sm text-zinc-400">
            No jobs available right now.
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center text-sm text-zinc-400">
            No jobs match your current filters.
          </div>
        ) : (
          <>
            {/* Clean 2-Column Paginated Card Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {paginatedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  resumeId={resumeId}
                  isSelected={activeDrawerJob?.id === job.id}
                  onSelect={(selected) => {
                    setActiveDrawerJob(selected);
                    setDrawerTab("OVERVIEW");
                  }}
                />
              ))}
            </div>

            {/* Numbered Pagination Controls */}
            {totalPages > 1 && (
              <nav
                aria-label="Job pages"
                className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/80 pt-5"
              >
                <span className="font-mono text-xs text-zinc-500 tabular-nums">
                  Showing {(safePage - 1) * JOBS_PER_PAGE + 1}–
                  {Math.min(safePage * JOBS_PER_PAGE, filteredJobs.length)} of{" "}
                  {filteredJobs.length}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 font-mono text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </button>

                  {pageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`h-8 min-w-[32px] rounded-lg border px-2.5 font-mono text-xs font-semibold tabular-nums transition ${
                        pageNum === safePage
                          ? "border-teal-500/60 bg-teal-500/15 text-teal-300"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 font-mono text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:opacity-40"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </div>

      {/* Dedicated Slide-Over Job Inspector Drawer (Replaces Long Vertical Description Column) */}
      {activeDrawerJob && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
          onClick={() => setActiveDrawerJob(null)}
        >
          <aside
            className="flex h-full w-full max-w-2xl flex-col border-l border-zinc-800 bg-[#09090b] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-teal-400">
                    Verified {activeDrawerJob.source}
                  </span>
                  {activeDrawerJob.isActive !== false && (
                    <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                      ACTIVE
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                  {activeDrawerJob.title}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-1 font-medium text-zinc-200">
                    <Building2 className="h-3.5 w-3.5 text-teal-400" />
                    {activeDrawerJob.company}
                  </span>
                  {activeDrawerJob.location && (
                    <>
                      <span>·</span>
                      <span>{activeDrawerJob.location}</span>
                    </>
                  )}
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatLastSynced(activeDrawerJob.lastSyncedAt)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDrawerJob(null)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white"
                aria-label="Close job details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-900/40 px-6 py-3.5">
              <Link
                to={`/matches/${activeDrawerJob.id}${
                  resumeId ? `?resumeId=${resumeId}` : ""
                }`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400"
              >
                <span>Match & Start Interview</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                to={`/skill-gaps/${activeDrawerJob.id}${
                  resumeId ? `?resumeId=${resumeId}` : ""
                }`}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-600 hover:text-white"
              >
                Skill Gaps
              </Link>

              <button
                type="button"
                onClick={() => void handleToggleSave(activeDrawerJob)}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#09090b] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white"
              >
                {savedJobIds.has(activeDrawerJob.id) ? (
                  <BookmarkCheck className="h-3.5 w-3.5 text-teal-400" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                <span>
                  {savedJobIds.has(activeDrawerJob.id) ? "Saved" : "Save"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleTrackApplication(activeDrawerJob)}
                disabled={isTracking}
                className="rounded-lg border border-zinc-800 bg-[#09090b] px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white"
              >
                {isTracking ? "Tracking..." : "Track"}
              </button>

              {activeDrawerJob.url && (
                <a
                  href={activeDrawerJob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-[#09090b] px-3 py-2 text-xs font-medium text-teal-400 hover:border-teal-500/40"
                >
                  <span>Official ATS</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Segmented View Tabs (Overview vs Full Description) */}
            <div className="flex border-b border-zinc-800 px-6">
              <button
                type="button"
                onClick={() => setDrawerTab("OVERVIEW")}
                className={`border-b-2 py-3 pr-5 font-mono text-xs font-semibold transition ${
                  drawerTab === "OVERVIEW"
                    ? "border-teal-400 text-teal-300"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Overview & Required Skills (
                {activeDrawerJob.requirements.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("DESCRIPTION")}
                className={`border-b-2 px-5 py-3 font-mono text-xs font-semibold transition ${
                  drawerTab === "DESCRIPTION"
                    ? "border-teal-400 text-teal-300"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Full Job Description
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {drawerTab === "OVERVIEW" ? (
                <div className="space-y-6">
                  {activeDrawerJob.salaryRange && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                        Compensation Range
                      </span>
                      <p className="mt-1 font-mono text-sm font-semibold text-teal-300">
                        {activeDrawerJob.salaryRange}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                      Extracted Skills & Requirements
                    </h3>
                    {activeDrawerJob.requirements.length === 0 ? (
                      <p className="mt-2 text-xs text-zinc-500">
                        No structured skill tags extracted. Switch to the Full
                        Job Description tab to read the complete posting.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activeDrawerJob.requirements.map((req) => (
                          <span
                            key={req}
                            className="rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 font-mono text-xs text-zinc-200"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                    <h4 className="text-sm font-semibold text-white">
                      Ready to test your fit for {activeDrawerJob.company}?
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                      Run a deterministic skill comparison against your active
                      resume, inspect missing priority skills, and start a
                      role-specific mock interview.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <Link
                        to={`/matches/${activeDrawerJob.id}${
                          resumeId ? `?resumeId=${resumeId}` : ""
                        }`}
                        className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-teal-400"
                      >
                        Run Resume Match
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDrawerTab("DESCRIPTION")}
                        className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white"
                      >
                        Read Full Posting →
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="prose prose-invert max-w-none text-sm leading-7 prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-li:text-zinc-300"
                  dangerouslySetInnerHTML={{
                    __html: decodeHtml(activeDrawerJob.description),
                  }}
                />
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
