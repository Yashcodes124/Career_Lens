import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  ExternalLink,
  Building2,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { fetchApplications, updateApplicationStatus } from "./trackerApi";
import type { Application, ApplicationStatus } from "./types";
import { useLatestResumeId } from "../resume/useResumes";

const statuses: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
];

const statusLabels: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const statusColors: Record<ApplicationStatus, string> = {
  SAVED: "border-zinc-700 bg-zinc-800 text-zinc-300",
  APPLIED: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  INTERVIEWING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  OFFER: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

export const TrackerPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStageFilter, setActiveStageFilter] = useState<
    ApplicationStatus | "ALL"
  >("ALL");
  const resumeId = useLatestResumeId();

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const results = await fetchApplications();
        setApplications(results);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load applications.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadApplications();
  }, []);

  const groupedApplications = useMemo(() => {
    return statuses.reduce(
      (groups, status) => {
        groups[status] = applications.filter(
          (application) => application.status === status,
        );
        return groups;
      },
      {} as Record<ApplicationStatus, Application[]>,
    );
  }, [applications]);

  // Only show stages that actually have applications
  const populatedStatuses = useMemo(() => {
    return statuses.filter((st) => groupedApplications[st]?.length > 0);
  }, [groupedApplications]);

  const visibleStatuses = useMemo(() => {
    if (activeStageFilter === "ALL") return populatedStatuses;
    return populatedStatuses.filter((st) => st === activeStageFilter);
  }, [populatedStatuses, activeStageFilter]);

  const handleStatusChange = async (
    applicationId: string,
    status: ApplicationStatus,
  ) => {
    try {
      setUpdatingId(applicationId);
      setError(null);
      const updated = await updateApplicationStatus(applicationId, status);
      setApplications((current) =>
        current.map((application) =>
          application.id === updated.id ? updated : application,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update application.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-6 flex flex-col gap-4 border-b border-zinc-800/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-teal-400">
              Active Pipeline
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Application Tracker
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Only active stages with tracked roles are shown below.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98]"
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Find Jobs</span>
          </Link>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-36 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40"
              />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
            <h2 className="text-base font-semibold text-white">
              No applications tracked yet
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Match or track a verified job from the Job Board and its stage
              will appear here.
            </p>
            <Link
              to="/jobs"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-teal-400"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Horizontal Stage Filter Pills (Only shows populated stages) */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveStageFilter("ALL")}
                  className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition ${
                    activeStageFilter === "ALL"
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  All Active ({applications.length})
                </button>
                {populatedStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setActiveStageFilter(status)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition ${
                      activeStageFilter === status
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <span>{statusLabels[status]}</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-300 tabular-nums">
                      {groupedApplications[status].length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Horizontal Stage Rows (Only populated stages rendered) */}
            {visibleStatuses.map((status) => {
              const list = groupedApplications[status];
              return (
                <section
                  key={status}
                  className="rounded-xl border border-zinc-800/90 bg-zinc-900/30 p-5"
                >
                  <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${statusColors[status]}`}
                      >
                        {statusLabels[status]}
                      </span>
                      <span className="font-mono text-xs text-zinc-400 tabular-nums">
                        {list.length} {list.length === 1 ? "role" : "roles"}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Row of Cards */}
                  <div className="space-y-3">
                    {list.map((app) => (
                      <HorizontalApplicationRow
                        key={app.id}
                        application={app}
                        resumeId={resumeId}
                        isUpdating={updatingId === app.id}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface ApplicationRowProps {
  application: Application;
  resumeId?: string;
  isUpdating: boolean;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void;
}

const HorizontalApplicationRow: React.FC<ApplicationRowProps> = ({
  application,
  resumeId,
  isUpdating,
  onStatusChange,
}) => {
  const { job } = application;
  const matchPath = `/matches/${application.jobId}${
    resumeId ? `?resumeId=${resumeId}` : ""
  }`;
  const skillGapPath = `/skill-gaps/${application.jobId}${
    resumeId ? `?resumeId=${resumeId}` : ""
  }`;
  const tailorPath = `/tailor/${application.jobId}${
    resumeId ? `?resumeId=${resumeId}` : ""
  }`;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-[#09090b] p-4 transition hover:border-zinc-700 lg:flex-row lg:items-center lg:justify-between">
      {/* Left: Role & Company Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-teal-400">
            {job.source}
          </span>
          <span className="text-zinc-700">·</span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300">
            <Building2 className="h-3 w-3 text-zinc-500" />
            {job.company}
          </span>
          {job.location && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                <MapPin className="h-3 w-3 text-zinc-500" />
                {job.location}
              </span>
            </>
          )}
        </div>

        <Link
          to={matchPath}
          className="mt-1 block truncate text-base font-semibold text-zinc-100 transition hover:text-teal-300"
        >
          {job.title}
        </Link>
      </div>

      {/* Middle: Match Telemetry */}
      <div className="flex items-center gap-4 lg:w-44">
        {application.matchScore != null ? (
          <div className="w-full">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-zinc-500">Match</span>
              <span className="font-semibold text-emerald-400 tabular-nums">
                {Math.round(application.matchScore)}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{
                  width: `${Math.min(Math.max(application.matchScore, 0), 100)}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <span className="font-mono text-xs text-zinc-500">
            No match score
          </span>
        )}
      </div>

      {/* Right: Horizontal Actions & Stage Mover */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={skillGapPath}
          className="inline-flex items-center gap-1 rounded-lg bg-teal-500/15 border border-teal-500/30 px-3 py-1.5 text-xs font-medium text-teal-300 transition hover:bg-teal-500/25"
        >
          <span>Practice Interview</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>

        <Link
          to={tailorPath}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white"
        >
          Tailor
        </Link>

        <select
          value={application.status}
          disabled={isUpdating}
          aria-label={`Change status for ${job.title}`}
          onChange={(event) =>
            onStatusChange(
              application.id,
              event.target.value as ApplicationStatus,
            )
          }
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-zinc-200 outline-none focus:border-teal-500 disabled:opacity-50"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              Stage: {statusLabels[status]}
            </option>
          ))}
        </select>

        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open official job posting"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  );
};

export default TrackerPage;
