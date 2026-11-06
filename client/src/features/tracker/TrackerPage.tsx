import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  ExternalLink,
  Building2,
  MapPin,
  ArrowUpRight,
  Calendar,
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
  SAVED: "border-slate-200 bg-slate-100 text-slate-700",
  APPLIED: "border-blue-200 bg-blue-50 text-blue-700",
  INTERVIEWING: "border-amber-200 bg-amber-50 text-amber-800",
  OFFER: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Application Pipeline
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Applications
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Track every opportunity and its preparation status.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Add application</span>
          </Link>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <Briefcase className="mx-auto h-7 w-7 text-slate-400" />
            <h2 className="mt-3 text-base font-semibold text-slate-900">
              No applications yet.
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Save a job to start tracking your application pipeline.
            </p>
            <Link
              to="/jobs"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              Browse verified jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pipeline Stage Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveStageFilter("ALL")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeStageFilter === "ALL"
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  All Stages ({applications.length})
                </button>
                {statuses.map((status) => {
                  const count = groupedApplications[status]?.length ?? 0;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        count > 0 ? setActiveStageFilter(status) : undefined
                      }
                      disabled={count === 0}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        activeStageFilter === status
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : count > 0
                            ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            : "text-slate-300 cursor-not-allowed"
                      }`}
                    >
                      <span>{statusLabels[status]}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 tabular-nums">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {visibleStatuses.map((status) => {
              const list = groupedApplications[status];
              return (
                <section
                  key={status}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`rounded-md border px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}
                      >
                        {statusLabels[status]}
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {list.length}{" "}
                        {list.length === 1 ? "application" : "applications"}
                      </span>
                    </div>
                  </div>

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
      </main>
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
  const gaps = application.skillGaps ?? [];

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700">
            {job.source}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            {job.company}
          </span>
          {job.location && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {job.location}
              </span>
            </>
          )}
          {application.updatedAt && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Calendar className="h-3 w-3 text-slate-400" />
                Updated {new Date(application.updatedAt).toLocaleDateString()}
              </span>
            </>
          )}
        </div>

        <Link
          to={matchPath}
          className="mt-1.5 block truncate text-base font-semibold text-slate-900 transition hover:text-blue-600"
        >
          {job.title}
        </Link>

        {gaps.length > 0 && (
          <p className="mt-1 truncate text-xs text-slate-600">
            Skill gaps ({gaps.length}): {gaps.slice(0, 4).join(", ")}
            {gaps.length > 4 ? ` +${gaps.length - 4} more` : ""}
          </p>
        )}
      </div>

      {/* Match Score Bar */}
      <div className="flex items-center gap-4 lg:w-44">
        {application.matchScore != null ? (
          <div className="w-full">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Match score</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {Math.round(application.matchScore)}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${Math.min(Math.max(application.matchScore, 0), 100)}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <Link
            to={matchPath}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Calculate match →
          </Link>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={skillGapPath}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <span>Start interview</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>

        <Link
          to={matchPath}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          View match
        </Link>

        <Link
          to={tailorPath}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 disabled:opacity-50"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              Status: {statusLabels[status]}
            </option>
          ))}
        </select>

        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            title="View job on company site"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  );
};

export default TrackerPage;
