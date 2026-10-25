import { Link } from "react-router-dom";
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

const CARD = "rounded-2xl border border-gray-800 bg-gray-900 p-6";

const ApplicationsCard: React.FC<{ resumeId?: string }> = ({ resumeId }) => {
  const { data, isLoading, isError, refetch } = useApplications();
  const recent = (data ?? []).slice(0, 5);

  return (
    <section className={CARD} aria-labelledby="applications-heading">
      <div className="flex items-center justify-between gap-4">
        <h2 id="applications-heading" className="text-lg font-semibold text-white">
          Applications
        </h2>
        <Link to="/applications" className="text-sm text-teal-400 hover:text-teal-300">
          View all
        </Link>
      </div>

      {isLoading && <p className="mt-4 text-sm text-gray-400">Loading applications...</p>}

      {isError && (
        <div role="alert" className="mt-4 text-sm text-red-400">
          <p>We could not load your applications.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-lg border border-red-500/40 px-3 py-1.5 text-red-200 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && recent.length === 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-400">
            No applications yet. Open a verified job and match it to start tracking.
          </p>
          <Link
            to="/jobs"
            className="mt-3 inline-block rounded-xl border border-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            Browse verified jobs
          </Link>
        </div>
      )}

      {recent.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-800">
          {recent.map((application) => (
            <ApplicationRow key={application.id} application={application} resumeId={resumeId} />
          ))}
        </ul>
      )}
    </section>
  );
};

const ApplicationRow: React.FC<{ application: Application; resumeId?: string }> = ({
  application,
  resumeId,
}) => {
  const matchPath = `/matches/${application.jobId}${resumeId ? `?resumeId=${resumeId}` : ""}`;
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <Link to={matchPath} className="block truncate font-medium text-white hover:text-teal-300">
          {application.job.title}
        </Link>
        <p className="truncate text-sm text-gray-400">{application.job.company}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm text-gray-200">{STATUS_LABEL[application.status]}</p>
        <p className="text-xs text-gray-400">
          {application.matchScore != null ? `${application.matchScore}% match` : "No score yet"}
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
      <h2 id="resume-heading" className="text-lg font-semibold text-white">
        Resume
      </h2>

      {isLoading && <p className="mt-4 text-sm text-gray-400">Loading your resume...</p>}

      {isError && (
        <div role="alert" className="mt-4 text-sm text-red-400">
          <p>We could not load your resume.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-lg border border-red-500/40 px-3 py-1.5 text-red-200 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && !latest && (
        <div className="mt-4">
          <p className="text-sm text-gray-400">
            Upload a resume so each job can be compared with your skills.
          </p>
          <Link
            to="/resume"
            className="mt-3 inline-block rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            Upload a resume
          </Link>
        </div>
      )}

      {latest && (
        <div className="mt-4">
          <p className="truncate font-medium text-white">{latest.fileName ?? latest.title}</p>
          <p className="mt-1 text-sm text-gray-400">
            Uploaded {new Date(latest.createdAt).toLocaleDateString()} · {latest.skills.length} skills
          </p>
          <Link to="/resume" className="mt-3 inline-block text-sm text-teal-400 hover:text-teal-300">
            Manage resumes
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
    <div className="min-h-screen bg-gray-950 text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-gray-400">Here is what to do next.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/jobs"
              className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            >
              Find matching jobs
            </Link>
            <Link
              to="/applications"
              className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
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
