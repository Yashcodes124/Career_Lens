import React from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Target,
  Layers,
  UploadCloud,
} from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { useAuth } from "../auth/useAuth";
import { ReadinessPanel } from "../readiness/ReadinessPanel";
import { useResumes } from "../resume/useResumes";
import { useApplications } from "../tracker/useApplications";
import type { Application, ApplicationStatus } from "../tracker/types";

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; badgeClass: string }
> = {
  SAVED: {
    label: "Saved",
    badgeClass: "border-slate-700 bg-slate-800/80 text-slate-300",
  },
  APPLIED: {
    label: "Applied",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  },
  INTERVIEWING: {
    label: "Interviewing",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  OFFER: {
    label: "Offer",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  },
};

const CARD =
  "rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 shadow-lg shadow-black/20 backdrop-blur-sm";

const ApplicationsCard: React.FC<{ resumeId?: string }> = ({ resumeId }) => {
  const { data, isLoading, isError, refetch } = useApplications();
  const applications = data ?? [];
  const recent = applications.slice(0, 5);

  return (
    <section className={CARD} aria-labelledby="applications-heading">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
            <Layers className="h-4 w-4" />
          </span>
          <div>
            <h2
              id="applications-heading"
              className="text-base font-semibold text-white"
            >
              Active Applications Pipeline
            </h2>
            <p className="text-xs text-slate-400">
              {applications.length > 0
                ? `Tracking ${applications.length} verified role${applications.length === 1 ? "" : "s"}`
                : "Track your progress from discovery to offer"}
            </p>
          </div>
        </div>
        <Link
          to="/applications"
          className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 transition hover:text-teal-300"
        >
          <span>Open Tracker</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading && (
        <div className="mt-5 space-y-3" aria-busy="true">
          <p className="sr-only">Loading applications...</p>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl border border-slate-800/60 bg-slate-800/40"
            />
          ))}
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="mt-5 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>We could not load your applications.</span>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && recent.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm font-medium text-slate-300">
            No applications tracked yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Open a verified job and match it against your resume to start
            tracking.
          </p>
          <Link
            to="/jobs"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:border-teal-500/50 hover:bg-slate-800"
          >
            <span>Browse verified jobs</span>
            <ArrowRight className="h-3.5 w-3.5 text-teal-400" />
          </Link>
        </div>
      )}

      {recent.length > 0 && (
        <ul className="mt-5 divide-y divide-slate-800/80">
          {recent.map((application) => (
            <ApplicationRow
              key={application.id}
              application={application}
              resumeId={resumeId}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

const ApplicationRow: React.FC<{
  application: Application;
  resumeId?: string;
}> = ({ application, resumeId }) => {
  const matchPath = `/matches/${application.jobId}${
    resumeId ? `?resumeId=${resumeId}` : ""
  }`;
  const statusInfo = STATUS_CONFIG[application.status] ?? {
    label: application.status,
    badgeClass: "border-slate-700 bg-slate-800 text-slate-300",
  };

  const score = application.matchScore;
  const scoreColor =
    score == null
      ? "text-slate-400 border-slate-800 bg-slate-900"
      : score >= 75
        ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
        : score >= 50
          ? "text-amber-300 border-amber-500/30 bg-amber-500/10"
          : "text-rose-300 border-rose-500/30 bg-rose-500/10";

  return (
    <li className="group flex items-center justify-between gap-4 py-3.5 transition">
      <div className="min-w-0 flex-1">
        <Link
          to={matchPath}
          className="block truncate text-sm font-semibold text-white transition group-hover:text-teal-300"
        >
          {application.job.title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {application.job.company}
          {application.job.location ? ` · ${application.job.location}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <span
          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${scoreColor}`}
        >
          {score != null ? `${Math.round(score)}% match` : "No score yet"}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.badgeClass}`}
        >
          {statusInfo.label}
        </span>
      </div>
    </li>
  );
};

const ResumeCard: React.FC = () => {
  const { data, isLoading, isError, refetch } = useResumes();
  const latest = data?.[0];

  return (
    <section className={CARD} aria-labelledby="resume-heading">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h2
              id="resume-heading"
              className="text-base font-semibold text-white"
            >
              Active Resume Profile
            </h2>
            <p className="text-xs text-slate-400">
              Source of truth for matching
            </p>
          </div>
        </div>
        {latest && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Parsed
          </span>
        )}
      </div>

      {isLoading && (
        <div className="mt-5 space-y-3" aria-busy="true">
          <p className="sr-only">Loading your resume...</p>
          <div className="h-16 animate-pulse rounded-xl bg-slate-800/40" />
          <div className="h-8 animate-pulse rounded-xl bg-slate-800/40" />
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300"
        >
          <p>We could not load your resume.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/10"
          >
            <RefreshCw className="h-3 w-3" />
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && !latest && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-5 text-center">
          <UploadCloud className="mx-auto h-8 w-8 text-teal-400" />
          <p className="mt-2 text-sm text-slate-300">
            Upload a resume so each job can be compared with your skills.
          </p>
          <Link
            to="/resume"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-teal-500"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Upload a resume
          </Link>
        </div>
      )}

      {latest && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <p className="truncate text-sm font-semibold text-white">
              {latest.fileName ?? latest.title}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Uploaded {new Date(latest.createdAt).toLocaleDateString()} ·{" "}
              <span className="font-medium text-teal-300">
                {latest.skills.length} skills extracted
              </span>
            </p>
          </div>

          {latest.skills.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Top Extracted Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {latest.skills.slice(0, 8).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-xs text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
                {latest.skills.length > 8 && (
                  <span className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-xs text-teal-400">
                    +{latest.skills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          <Link
            to="/resume"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-teal-500/40 hover:bg-slate-800 hover:text-white"
          >
            <span>Manage resumes</span>
            <ArrowRight className="h-3.5 w-3.5 text-teal-400" />
          </Link>
        </div>
      )}
    </section>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: resumes } = useResumes();
  const latestResumeId = resumes?.[0]?.id;
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-teal-950/30 p-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-300">
              <Sparkles className="h-3 w-3" />
              <span>Closed-Loop Career Readiness</span>
            </div>
            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {user?.targetRole
                ? `Target Role: ${user.targetRole} — Here is your highest-impact next step.`
                : "Here is what to do next to improve your interview readiness."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-teal-500/20 transition hover:bg-teal-400"
            >
              <Briefcase className="h-4 w-4" />
              <span>Find matching jobs</span>
            </Link>
            <Link
              to="/applications"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-sm font-medium text-white transition hover:border-slate-600 hover:bg-slate-800"
            >
              <Target className="h-4 w-4 text-teal-400" />
              <span>Practise an interview</span>
            </Link>
          </div>
        </header>

        <ReadinessPanel />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ApplicationsCard resumeId={latestResumeId} />
          </div>
          <ResumeCard />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
