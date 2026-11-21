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
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  Globe,
  CheckCircle2,
} from "lucide-react";
import {
  fetchSavedJobs,
  unsaveJob,
  saveJob,
  syncVerifiedJobs,
  fetchJobsWithMeta,
} from "./jobsApi";
import { JobCard, formatJobSourceLabel, getJobFreshness } from "./JobCard";
import type { Job, SyncHealth } from "./types";
import { createApplication } from "../tracker/trackerApi";
import { useLatestResumeId } from "../resume/useResumes";
import { useAuth } from "../auth/useAuth";
import { apiClient } from "../../lib/api-client";
import {
  getSafeExternalUrl,
  sanitizeJobDescriptionHtml,
} from "../../lib/sanitize";

const JOBS_PER_PAGE = 12;

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [syncHealth, setSyncHealth] = useState<SyncHealth | null>(null);
  const [importForm, setImportForm] = useState({
    title: "",
    company: "",
    location: "Bengaluru, India",
    source: "LINKEDIN",
    url: "",
    salaryRange: "",
    description: "",
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const resumeId = useLatestResumeId();

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [{ jobs: results, syncHealth: health }, savedJobs] =
        await Promise.all([
          fetchJobsWithMeta(),
          fetchSavedJobs().catch(() => []),
        ]);
      setJobs(results);
      if (health) setSyncHealth(health);
      setSavedJobIds(new Set(savedJobs.map((job) => job.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load jobs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const handleSyncVerifiedJobs = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      setError(null);
      const syncRes = await syncVerifiedJobs();
      await loadJobs();
      setSyncHealth({
        status: "HEALTHY",
        lastSuccessfulSyncAt: new Date().toISOString(),
        totalFetched: syncRes.totalFetched,
        totalSaved: syncRes.totalSaved,
        totalDeactivated: syncRes.totalDeactivated,
      });
      setSyncBanner(
        `Sync complete: ${syncRes.totalSaved} roles added/updated, ${syncRes.totalDeactivated} stale listings deactivated.`,
      );
      setTimeout(() => setSyncBanner(null), 6000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sync verified jobs.",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportExternalJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isImporting) return;
    setImportError(null);

    try {
      setIsImporting(true);
      const res = await apiClient.post<{
        success: boolean;
        data: Job;
        job?: Job;
      }>("/jobs/external", importForm);
      const created = res.data ?? res.job!;
      setJobs((prev) => [created, ...prev]);
      setIsImportModalOpen(false);
      setImportForm({
        title: "",
        company: "",
        location: "Bengaluru, India",
        source: "LINKEDIN",
        url: "",
        salaryRange: "",
        description: "",
      });

      if (resumeId) {
        navigate(`/matches/${created.id}?resumeId=${resumeId}`);
      } else {
        setActiveDrawerJob(created);
      }
    } catch (err: any) {
      setImportError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not import job. Check all fields.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const crossPlatformLinks = useMemo(() => {
    const roleQuery = search.trim() || user?.targetRole || "Software Engineer";
    const locQuery = locationFilter.trim() || "India";
    const q = encodeURIComponent(roleQuery);
    const l = encodeURIComponent(locQuery);
    const slugRole = roleQuery
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return [
      {
        name: "LinkedIn Jobs",
        badge: "India & Global",
        url: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}`,
      },
      {
        name: "Naukri.com",
        badge: "India",
        url: `https://www.naukri.com/${slugRole}-jobs?k=${q}&l=${l}`,
      },
      {
        name: "Indeed India",
        badge: "Verified Feeds",
        url: `https://in.indeed.com/jobs?q=${q}&l=${l}`,
      },
      {
        name: "Glassdoor",
        badge: "Reviews & Pay",
        url: `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${q}`,
      },
      {
        name: "Wellfound",
        badge: "Startups",
        url: `https://wellfound.com/jobs`,
      },
      {
        name: "Instahyre",
        badge: "Product Tech",
        url: `https://www.instahyre.com/search-jobs/`,
      },
    ];
  }, [search, locationFilter, user?.targetRole]);

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

  const { deduplicatedJobs, duplicateCount } = useMemo(() => {
    const map = new Map<string, Job>();
    let dupes = 0;
    for (const job of jobs) {
      const key = `${job.company.toLowerCase().trim()}::${job.title
        .toLowerCase()
        .replace(/\b(sr\.?|senior|jr\.?|junior|i|ii|iii)\b/g, "")
        .replace(/[^a-z0-9]/g, "")}::${(job.location ?? "remote")
        .toLowerCase()
        .split(",")[0]
        .trim()}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          ...job,
          duplicateSources: [job.source || "GREENHOUSE"],
        });
      } else {
        dupes++;
        const mergedSources = Array.from(
          new Set([
            ...(existing.duplicateSources ?? []),
            job.source || "GREENHOUSE",
          ]),
        );
        const newer =
          new Date(job.lastSyncedAt).getTime() >
          new Date(existing.lastSyncedAt).getTime()
            ? job
            : existing;
        map.set(key, { ...newer, duplicateSources: mergedSources });
      }
    }
    return { deduplicatedJobs: [...map.values()], duplicateCount: dupes };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedLocation = locationFilter.trim().toLowerCase();

    return deduplicatedJobs.filter((job) => {
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
  }, [deduplicatedJobs, search, locationFilter, sourceFilter]);

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
    <div className="min-h-screen bg-canvas text-content-body theme-surface-transition">

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 1. Page Header */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              Verified Job Discovery
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-content-heading sm:text-3xl">
              Explore Jobs
            </h1>
            <p className="mt-1 text-sm text-content-secondary">
              Browse verified engineering roles from public company job boards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void loadJobs()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-content-body transition-all duration-150 hover:border-border-strong hover:bg-muted hover:text-content-heading disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-primary ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
              <span>{isLoading ? "Refreshing..." : "Refresh listings"}</span>
            </button>

            {user?.role === "ADMIN" && (
              <button
                type="button"
                onClick={() => void handleSyncVerifiedJobs()}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-content-body transition-all duration-150 hover:border-border-strong hover:bg-muted hover:text-content-heading disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 text-primary ${
                    isSyncing ? "animate-spin" : ""
                  }`}
                />
                <span>{isSyncing ? "Syncing..." : "Sync Greenhouse"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary-hover active:scale-[0.98]"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Analyze external job</span>
            </button>

            <Link
              to="/saved-jobs"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-content-body transition-all duration-150 hover:border-border-strong hover:bg-muted hover:text-content-heading"
            >
              <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
              <span>Saved ({savedJobIds.size})</span>
            </Link>
          </div>
        </header>

        {/* Sync Health & Source Integrity Indicator */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-xs shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-status-success">
              <span className="h-2 w-2 rounded-full bg-status-success" />
              ATS Sync Health: Operational
            </span>
            <span className="text-border-strong">|</span>
            <span className="text-content-secondary tabular-nums">
              <strong className="font-semibold text-content-heading">
                Last sync:
              </strong>{" "}
              {formatLastSynced(
                syncHealth?.lastSuccessfulSyncAt ?? jobs[0]?.lastSyncedAt,
              )}
            </span>
            <span className="text-border-strong">|</span>
            <span className="text-content-secondary tabular-nums">
              <strong className="font-semibold text-content-heading">
                {syncHealth?.totalSaved ?? jobs.length}
              </strong>{" "}
              added/updated ·{" "}
              <strong className="font-semibold text-content-heading">
                {syncHealth?.totalDeactivated ?? 0}
              </strong>{" "}
              deactivated ·{" "}
              <strong className="font-semibold text-content-heading">
                {duplicateCount}
              </strong>{" "}
              cross-ATS duplicates merged
            </span>
          </div>
          <span className="text-[11px] font-medium text-content-secondary">
            Sources: Greenhouse · Lever · Ashby · LinkedIn
          </span>
        </div>

        {syncBanner && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-status-success-border bg-status-success-soft px-4 py-3 text-xs font-medium text-status-success">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{syncBanner}</span>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setSyncBanner(null)}
              className="opacity-80 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* External Job Boards Shortcut */}
        <div className="mb-5 rounded-xl border border-border bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-content-heading">
                External Job Boards (filtered for "
                {search.trim() || user?.targetRole || "Software Engineer"}" in "
                {locationFilter.trim() || "India"}")
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="text-xs font-medium text-primary hover:text-primary-hover"
            >
              Paste a job description to analyze requirements →
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {crossPlatformLinks.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-lg border border-border bg-muted/60 px-3 py-2 transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-content-heading group-hover:text-primary">
                    {platform.name}
                  </p>
                  <p className="text-[11px] text-content-secondary">
                    {platform.badge}
                  </p>
                </div>
                <ExternalLink className="h-3 w-3 shrink-0 text-content-secondary group-hover:text-primary" />
              </a>
            ))}
          </div>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="mb-4 grid gap-3 rounded-xl border border-border bg-surface p-4 shadow-card md:grid-cols-[1.5fr_1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by job title, company, or skill (e.g. React, Node.js, Stripe)..."
              className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2 text-xs text-content-heading outline-none placeholder:text-content-secondary focus:border-primary"
            />
          </div>

          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-secondary" />
            <input
              type="text"
              value={locationFilter}
              onChange={(event) => {
                setLocationFilter(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Location (e.g. Bengaluru, Remote, India)..."
              className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2 text-xs text-content-heading outline-none placeholder:text-content-secondary focus:border-primary"
            />
          </div>

          {sources.length > 1 && (
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by source"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-content-heading outline-none focus:border-primary"
            >
              {sources.map((src) => (
                <option key={src} value={src}>
                  {src === "ALL" ? "All sources" : src}
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
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-content-body transition-colors hover:border-border-strong hover:bg-muted hover:text-content-heading"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Quick Region & Role Pills */}
        {commonRoleTitles.length > 0 && (
          <div className="mb-6 space-y-2.5 rounded-xl border border-border bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-content-secondary">
                Quick filters by role and location
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: "All locations", val: "" },
                  { label: "India", val: "India" },
                  { label: "Bengaluru", val: "Bengaluru" },
                  { label: "Pune / Hyderabad", val: "Pune" },
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
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-primary/40 bg-primary-soft text-primary"
                          : "border-border bg-muted text-content-secondary hover:border-border-strong hover:text-content-heading"
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
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary/50 bg-primary-soft text-primary"
                        : "border-border bg-surface text-content-body hover:border-border-strong hover:bg-muted"
                    }`}
                  >
                    <span className="max-w-[200px] truncate">{title}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-content-secondary tabular-nums">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-content-secondary">
          <p className="tabular-nums">
            Showing {filteredJobs.length}{" "}
            {filteredJobs.length === 1 ? "role" : "roles"} · Page {safePage} of{" "}
            {totalPages}
          </p>
          {!resumeId && (
            <Link
              to="/resume"
              className="font-medium text-primary hover:underline"
            >
              Upload your resume to see requirement coverage for each role →
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-status-danger-border bg-status-danger-soft p-4 text-sm text-status-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-40 animate-pulse rounded-xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface p-12 text-center shadow-card">
            <p className="text-sm font-medium text-content-heading">
              No jobs synchronized yet
            </p>
            <p className="mt-1 text-xs text-content-secondary">
              Click "Refresh listings" above to synchronize verified listings
              from public job boards.
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface p-12 text-center shadow-card">
            <p className="text-base font-semibold text-content-heading">
              No jobs match your filters.
            </p>
            <p className="mt-1 text-xs text-content-secondary">
              Try widening your location or experience filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setLocationFilter("");
                setSourceFilter("ALL");
                setCurrentPage(1);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear filters</span>
            </button>
          </div>
        ) : (
          <>
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

            {totalPages > 1 && (
              <nav
                aria-label="Job pages"
                className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"
              >
                <span className="text-xs text-content-secondary tabular-nums">
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
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-content-body transition-colors hover:border-border-strong hover:bg-muted disabled:opacity-40"
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
                      className={`h-8 min-w-[32px] rounded-lg border px-2.5 font-mono text-xs font-semibold tabular-nums transition-colors ${
                        pageNum === safePage
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface text-content-body hover:border-border-strong hover:bg-muted"
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
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-content-body transition-colors hover:border-border-strong hover:bg-muted disabled:opacity-40"
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

      {/* Modal: Import External Job */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
          onClick={() => !isImporting && setIsImportModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-border bg-surface p-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                  Analyze External Role
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold text-content-heading">
                  Import a Job Description
                </h2>
                <p className="mt-0.5 text-xs text-content-secondary">
                  Paste any job listing to extract required skills, calculate
                  requirement coverage, and practice a targeted interview.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close import modal"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-lg border border-border bg-surface p-1.5 text-content-secondary hover:bg-muted hover:text-content-heading"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {importError && (
              <div className="mt-4 rounded-lg border border-status-danger-border bg-status-danger-soft p-3 text-xs text-status-danger">
                {importError}
              </div>
            )}

            <form onSubmit={handleImportExternalJob} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-content-heading">
                    Role title *
                  </label>
                  <input
                    type="text"
                    required
                    value={importForm.title}
                    onChange={(e) =>
                      setImportForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="e.g., Full-Stack Engineer"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-content-heading outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-content-heading">
                    Company name *
                  </label>
                  <input
                    type="text"
                    required
                    value={importForm.company}
                    onChange={(e) =>
                      setImportForm((f) => ({ ...f, company: e.target.value }))
                    }
                    placeholder="e.g., Stripe, Razorpay"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-content-heading outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-content-heading">
                    Source
                  </label>
                  <select
                    value={importForm.source}
                    onChange={(e) =>
                      setImportForm((f) => ({ ...f, source: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-content-heading outline-none focus:border-primary"
                  >
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="NAUKRI">Naukri.com</option>
                    <option value="INDEED">Indeed</option>
                    <option value="GLASSDOOR">Glassdoor</option>
                    <option value="WELLFOUND">Wellfound</option>
                    <option value="GREENHOUSE">Greenhouse</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-content-heading">
                    Location
                  </label>
                  <input
                    type="text"
                    value={importForm.location}
                    onChange={(e) =>
                      setImportForm((f) => ({ ...f, location: e.target.value }))
                    }
                    placeholder="Bengaluru, India"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-content-heading outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-content-heading">
                    Job URL (optional)
                  </label>
                  <input
                    type="url"
                    value={importForm.url}
                    onChange={(e) =>
                      setImportForm((f) => ({ ...f, url: e.target.value }))
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-content-heading outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-content-heading">
                  Job description & requirements *
                </label>
                <textarea
                  rows={5}
                  required
                  value={importForm.description}
                  onChange={(e) =>
                    setImportForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Paste the full job description here..."
                  className="w-full resize-none rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-content-heading outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-content-body hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:opacity-50"
                >
                  <span>
                    {isImporting ? "Analyzing..." : "Save & run match →"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Job Detail Drawer */}
      {activeDrawerJob && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px]"
          onClick={() => setActiveDrawerJob(null)}
        >
          <aside
            className="flex h-full w-full max-w-2xl flex-col border-l border-border bg-surface shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-primary/30 bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                    {formatJobSourceLabel(activeDrawerJob.source)}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                      getJobFreshness(activeDrawerJob).state === "ACTIVE"
                        ? "border-status-success-border bg-status-success-soft text-status-success"
                        : getJobFreshness(activeDrawerJob).state ===
                            "POSSIBLY_STALE"
                          ? "border-status-warning-border bg-status-warning-soft text-status-warning"
                          : "border-status-danger-border bg-status-danger-soft text-status-danger"
                    }`}
                  >
                    {getJobFreshness(activeDrawerJob).label}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-xl font-semibold text-content-heading sm:text-2xl">
                  {activeDrawerJob.title}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-content-secondary">
                  <span className="inline-flex items-center gap-1 font-medium text-content-heading">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    {activeDrawerJob.company}
                  </span>
                  {activeDrawerJob.location && (
                    <>
                      <span>·</span>
                      <span>{activeDrawerJob.location}</span>
                    </>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-content-secondary tabular-nums">
                  <span>
                    Posted: {formatLastSynced(activeDrawerJob.createdAt)}
                  </span>
                  <span>·</span>
                  <span>
                    Updated: {formatLastSynced(activeDrawerJob.updatedAt)}
                  </span>
                  <span>·</span>
                  <span>
                    Last synced:{" "}
                    {formatLastSynced(activeDrawerJob.lastSyncedAt)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawerJob(null)}
                className="rounded-lg border border-border bg-surface p-2 text-content-secondary hover:bg-muted hover:text-content-heading"
                aria-label="Close job details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/60 px-6 py-3.5">
              <Link
                to={`/matches/${activeDrawerJob.id}${
                  resumeId ? `?resumeId=${resumeId}` : ""
                }`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary-hover"
              >
                <span>Run match</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                to={`/skill-gaps/${activeDrawerJob.id}${
                  resumeId ? `?resumeId=${resumeId}` : ""
                }`}
                className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-content-body hover:bg-muted hover:text-content-heading"
              >
                Start targeted interview
              </Link>

              <button
                type="button"
                onClick={() => void handleToggleSave(activeDrawerJob)}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-content-body hover:bg-muted hover:text-content-heading"
              >
                {savedJobIds.has(activeDrawerJob.id) ? (
                  <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                <span>
                  {savedJobIds.has(activeDrawerJob.id) ? "Saved" : "Save job"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleTrackApplication(activeDrawerJob)}
                disabled={isTracking}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-content-body hover:bg-muted hover:text-content-heading"
              >
                {isTracking ? "Adding..." : "Add to tracker"}
              </button>

              {getSafeExternalUrl(activeDrawerJob.url) && (
                <a
                  href={getSafeExternalUrl(activeDrawerJob.url)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-primary hover:bg-primary-soft"
                >
                  <span>Apply on company site</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="flex border-b border-border px-6">
              <button
                type="button"
                onClick={() => setDrawerTab("OVERVIEW")}
                className={`border-b-2 py-3 pr-5 text-xs font-semibold transition-colors ${
                  drawerTab === "OVERVIEW"
                    ? "border-primary text-primary"
                    : "border-transparent text-content-secondary hover:text-content-heading"
                }`}
              >
                Requirements ({activeDrawerJob.requirements.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("DESCRIPTION")}
                className={`border-b-2 px-5 py-3 text-xs font-semibold transition-colors ${
                  drawerTab === "DESCRIPTION"
                    ? "border-primary text-primary"
                    : "border-transparent text-content-secondary hover:text-content-heading"
                }`}
              >
                Full description
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {drawerTab === "OVERVIEW" ? (
                <div className="space-y-6">
                  {activeDrawerJob.salaryRange && (
                    <div className="rounded-lg border border-border bg-muted p-4">
                      <span className="text-xs font-medium text-content-secondary">
                        Salary range
                      </span>
                      <p className="mt-1 text-sm font-semibold text-content-heading">
                        {activeDrawerJob.salaryRange}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-content-heading">
                      Extracted Requirements
                    </h3>
                    {activeDrawerJob.requirements.length === 0 ? (
                      <p className="mt-2 text-xs text-content-secondary">
                        No structured skill tags were listed on this posting.
                        Switch to the Full description tab to read the complete
                        role details.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activeDrawerJob.requirements.map((req) => (
                          <span
                            key={req}
                            className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-content-body"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="max-w-none space-y-3 text-sm leading-7 text-content-body"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeJobDescriptionHtml(
                      activeDrawerJob.description,
                    ),
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
