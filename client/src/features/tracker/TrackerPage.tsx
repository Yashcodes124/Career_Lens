import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Kanban,
  Briefcase,
  ExternalLink,
  Sparkles,
  FileEdit,
  Building2,
  MapPin,
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
  SAVED: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  APPLIED: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  INTERVIEWING: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  OFFER: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  REJECTED: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

export const TrackerPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-teal-300">
              <Kanban className="h-3.5 w-3.5" />
              <span>TrueHire Pipeline</span>
            </div>
            <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Application Tracker
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Move roles from Saved to Offer while tracking match scores and
              interview readiness.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
          >
            <Briefcase className="h-4 w-4" />
            <span>Find Verified Jobs</span>
          </Link>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 xl:grid-cols-5">
            {statuses.map((st) => (
              <div
                key={st}
                className="h-[420px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
              />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-12 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-slate-600" />
            <h2 className="mt-3 text-xl font-semibold text-slate-200">
              No applications tracked yet
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Match or track a verified job from the Job Feed to manage your
              pipeline here.
            </p>
            <Link
              to="/jobs"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-teal-400"
            >
              Browse Verified Jobs
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Total Tracked Roles"
                value={applications.length}
              />
              <StatCard
                label="Active Interviews"
                value={
                  applications.filter(
                    (application) => application.status === "INTERVIEWING",
                  ).length
                }
              />
              <StatCard
                label="Offers Received"
                value={
                  applications.filter(
                    (application) => application.status === "OFFER",
                  ).length
                }
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-5">
              {statuses.map((status) => {
                const statusApplications = groupedApplications[status];

                return (
                  <section
                    key={status}
                    className="flex min-h-[440px] flex-col rounded-2xl border border-slate-800/90 bg-slate-900/50 p-3.5"
                  >
                    <div className="mb-3.5 flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            status === "SAVED"
                              ? "bg-slate-400"
                              : status === "APPLIED"
                                ? "bg-blue-400"
                                : status === "INTERVIEWING"
                                  ? "bg-amber-400"
                                  : status === "OFFER"
                                    ? "bg-emerald-400"
                                    : "bg-rose-400"
                          }`}
                        />
                        <h2 className="text-sm font-semibold text-slate-200">
                          {statusLabels[status]}
                        </h2>
                      </div>
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
                        {statusApplications.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3">
                      {statusApplications.map((application) => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          resumeId={resumeId}
                          isUpdating={updatingId === application.id}
                          onStatusChange={handleStatusChange}
                        />
                      ))}

                      {statusApplications.length === 0 && (
                        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-800/80 p-4 text-center text-xs text-slate-500">
                          No roles in {statusLabels[status]}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface ApplicationCardProps {
  application: Application;
  resumeId?: string;
  isUpdating: boolean;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  resumeId,
  isUpdating,
  onStatusChange,
}) => {
  const { job } = application;
  const matchPath = `/matches/${application.jobId}${
    resumeId ? `?resumeId=${resumeId}` : ""
  }`;
  const tailorPath = `/tailor/${application.jobId}${
    resumeId ? `?resumeId=${resumeId}` : ""
  }`;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/85 p-3.5 shadow-sm transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-md border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-300">
          {job.source}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColors[application.status]}`}
        >
          {statusLabels[application.status]}
        </span>
      </div>

      <Link
        to={matchPath}
        className="mt-2 block text-sm font-semibold text-white transition hover:text-teal-300"
      >
        {job.title}
      </Link>

      <div className="mt-1 space-y-0.5 text-xs text-slate-400">
        <p className="flex items-center gap-1 truncate">
          <Building2 className="h-3 w-3 shrink-0 text-slate-500" />
          <span className="truncate">{job.company}</span>
        </p>
        {job.location && (
          <p className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0 text-slate-500" />
            <span className="truncate">{job.location}</span>
          </p>
        )}
      </div>

      {application.matchScore != null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Match Score</span>
            <span className="font-semibold text-emerald-300">
              {Math.round(application.matchScore)}%
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${Math.min(Math.max(application.matchScore, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Closed-loop quick actions */}
      <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-slate-800/80 pt-3">
        <Link
          to={matchPath}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-teal-300 transition hover:border-teal-500/40"
        >
          <Sparkles className="h-3 w-3" />
          <span>Match & Prep</span>
        </Link>
        <Link
          to={tailorPath}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
        >
          <FileEdit className="h-3 w-3" />
          <span>Tailor</span>
        </Link>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
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
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-teal-500 disabled:opacity-50"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              Move: {statusLabels[status]}
            </option>
          ))}
        </select>

        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open official job posting"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 transition hover:border-teal-500/50 hover:text-teal-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  );
};

interface StatCardProps {
  label: string;
  value: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4">
    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
      {label}
    </p>
    <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
  </div>
);

export default TrackerPage;
