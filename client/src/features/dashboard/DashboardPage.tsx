import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, RotateCw } from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { useAuth } from "../auth/useAuth";
import { ReadinessPanel } from "../readiness/ReadinessPanel";
import { useResumes } from "../resume/useResumes";
import { useApplications } from "../tracker/useApplications";
import type { Application, ApplicationStatus } from "../tracker/types";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const CARD = "rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-6";

const ApplicationsCard: React.FC<{ resumeId?: string }> = ({ resumeId }) => {
  const { data, isLoading, isError, refetch } = useApplications();
  const recent = (data ?? []).slice(0, 5);

  return (
    <section className={CARD} aria-labelledby="applications-heading">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h2
            id="applications-heading"
            className="text-base font-semibold text-white"
          >
            Applications
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Recent roles in your readiness pipeline
          </p>
        </div>
        <Link
          to="/applications"
          className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 transition hover:text-teal-300"
        >
          <span>View all</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading && (
        <p className="mt-4 font-mono text-xs text-zinc-400">
          Loading applications...
        </p>
      )}

      {isError && (
        <div role="alert" className="mt-4 text-sm text-red-400">
          <p>We could not load your applications.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
          >
            <RotateCw className="h-3 w-3" />
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && recent.length === 0 && (
        <div className="mt-5 rounded-lg border border-dashed border-zinc-800 bg-[#09090b]/60 p-6">
          <p className="text-sm text-zinc-400">
            No applications yet. Open a verified job and match it to start
            tracking.
          </p>
          <Link
            to="/jobs"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:border-zinc-600 hover:bg-zinc-800"
          >
            <span>Browse verified jobs</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-teal-400" />
          </Link>
        </div>
      )}

      {recent.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-800/80">
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
  return (
    <li className="flex items-center justify-between gap-4 py-3.5 first:pt-1 last:pb-0">
      <div className="min-w-0">
        <Link
          to={matchPath}
          className="block truncate text-sm font-medium text-zinc-100 transition hover:text-teal-300"
        >
          {application.job.title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-zinc-400">
          {application.job.company}
        </p>
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <p className="text-xs font-medium text-zinc-200">
          {STATUS_LABEL[application.status]}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
          {application.matchScore != null
            ? `${Math.round(application.matchScore)}% match`
            : "No score yet"}
        </p>
      </div>
    </li>
  );
};

const ResumeCard: React.FC = () => {
  const { data, isLoading, isError, refetch } = useResumes();
  const latest = data?.[0];

  return (
    <section className={CARD} aria-labelledby="resume-heading">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <h2 id="resume-heading" className="text-base font-semibold text-white">
          Resume
        </h2>
        {latest && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
            ACTIVE
          </span>
        )}
      </div>

      {isLoading && (
        <p className="mt-4 font-mono text-xs text-zinc-400">
          Loading your resume...
        </p>
      )}

      {isError && (
        <div role="alert" className="mt-4 text-sm text-red-400">
          <p>We could not load your resume.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && !latest && (
        <div className="mt-5">
          <p className="text-sm text-zinc-400">
            Upload a resume so each job can be compared with your skills.
          </p>
          <Link
            to="/resume"
            className="mt-4 inline-block rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98]"
          >
            Upload a resume
          </Link>
        </div>
      )}

      {latest && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-[#09090b] p-3.5">
            <p className="truncate text-sm font-medium text-white">
              {latest.fileName ?? latest.title}
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-400 tabular-nums">
              Uploaded {new Date(latest.createdAt).toLocaleDateString()} ·{" "}
              {latest.skills.length} skills
            </p>
          </div>

          {latest.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {latest.skills.slice(0, 8).map((skill) => (
                <span
                  key={skill}
                  className="rounded border border-zinc-800 bg-[#09090b] px-2 py-0.5 font-mono text-[11px] text-zinc-300"
                >
                  {skill}
                </span>
              ))}
              {latest.skills.length > 8 && (
                <span className="rounded border border-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-500">
                  +{latest.skills.length - 8}
                </span>
              )}
            </div>
          )}

          <Link
            to="/resume"
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 hover:text-teal-300"
          >
            <span>Manage resumes</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <Navbar />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-teal-400">
              Readiness Workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Here is what to do next.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/jobs"
              className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98]"
            >
              Find matching jobs
            </Link>
            <Link
              to="/applications"
              className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:text-white"
            >
              Practise an interview
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
