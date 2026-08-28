//client/src/features/tracker/TrackerPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchApplications, updateApplicationStatus } from "./trackerApi";
import type { Application, ApplicationStatus } from "./types";

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
  INTERVIEWING: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  OFFER: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-300 border-red-500/20",
};

export const TrackerPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-400">
            Loading applications...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-indigo-300">
              Career Lens
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
              Application Tracker
            </h1>

            <p className="mt-2 text-slate-400">
              Track and manage your job applications.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Find Jobs
          </Link>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-200">
              No applications yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Track a job from the Job Feed to see it here.
            </p>

            <Link
              to="/jobs"
              className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-5">
            {statuses.map((status) => {
              const statusApplications = groupedApplications[status];

              return (
                <section
                  key={status}
                  className="min-h-[420px] rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          status === "SAVED"
                            ? "bg-slate-400"
                            : status === "APPLIED"
                              ? "bg-blue-400"
                              : status === "INTERVIEWING"
                                ? "bg-purple-400"
                                : status === "OFFER"
                                  ? "bg-emerald-400"
                                  : "bg-red-400"
                        }`}
                      />

                      <h2 className="font-semibold text-slate-200">
                        {statusLabels[status]}
                      </h2>

                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                        {statusApplications.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {statusApplications.map((application) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        isUpdating={updatingId === application.id}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>

                  {statusApplications.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-600">
                      No applications
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {applications.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Total Applications" value={applications.length} />

            <StatCard
              label="Interviews"
              value={
                applications.filter(
                  (application) => application.status === "INTERVIEWING",
                ).length
              }
            />

            <StatCard
              label="Offers"
              value={
                applications.filter(
                  (application) => application.status === "OFFER",
                ).length
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface ApplicationCardProps {
  application: Application;
  isUpdating: boolean;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  isUpdating,
  onStatusChange,
}) => {
  const { job } = application;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
            {job.source}
          </p>

          <h3 className="mt-1 font-semibold text-slate-100">{job.title}</h3>

          <p className="mt-1 text-sm text-slate-400">{job.company}</p>

          {job.location && (
            <p className="mt-1 text-xs text-slate-500">{job.location}</p>
          )}
        </div>

        <span
          className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${statusColors[application.status]}`}
        >
          {statusLabels[application.status]}
        </span>
      </div>

      {application.matchScore != null && (
        <div className="mt-4">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Match</span>

            <span className="font-semibold text-emerald-300">
              {application.matchScore}%
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

      <p className="mt-4 text-xs text-slate-500">
        Updated {new Date(application.updatedAt).toLocaleDateString()}
      </p>

      <div className="mt-4 flex gap-2">
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-center text-xs font-medium text-slate-300 transition hover:border-indigo-500 hover:text-indigo-300"
          >
            View Job
          </a>
        )}

        <select
          value={application.status}
          disabled={isUpdating}
          onChange={(event) =>
            onStatusChange(
              application.id,
              event.target.value as ApplicationStatus,
            )
          }
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
};

interface StatCardProps {
  label: string;
  value: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
  </div>
);

export default TrackerPage;