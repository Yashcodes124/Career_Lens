import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Play, RotateCw } from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { useAuth } from "../auth/useAuth";
import { ReadinessPanel } from "../readiness/ReadinessPanel";
import { useReadiness } from "../readiness/useReadiness";
import { useResumes } from "../resume/useResumes";
import { useApplications } from "../tracker/useApplications";
import type { Application, ApplicationStatus } from "../tracker/types";
import { fetchUserInterviews } from "../interview/interviewApi";
import type { Interview, InterviewQuestion } from "../interview/types";
import { CountUpNumber } from "../../components/ui/AceternityPrimitives";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const ApplicationsCard: React.FC<{ resumeId?: string }> = ({ resumeId }) => {
  const { data, isLoading, isError, refetch } = useApplications();
  const recent = (data ?? []).slice(0, 5);

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="applications-heading"
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2
            id="applications-heading"
            className="text-base font-semibold text-slate-900"
          >
            Recommended & Tracked Roles
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Recent roles and requirement coverage in your pipeline
          </p>
        </div>
        <Link
          to="/applications"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-700"
        >
          <span>View all</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading && (
        <div className="mt-4 space-y-2.5">
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
        </div>
      )}

      {isError && (
        <div role="alert" className="mt-4 text-sm text-red-700">
          <p>We could not load your applications.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            <RotateCw className="h-3 w-3" />
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && recent.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6">
          <p className="text-sm font-medium text-slate-900">
            No applications tracked yet
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Browse verified engineering roles and run a match to see requirement
            coverage and missing skills.
          </p>
          <Link
            to="/jobs"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <span>Browse verified jobs</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {recent.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-200">
          {recent.map((application: Application) => (
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
  const missingPreview = (application.skillGaps ?? []).slice(0, 3);

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-1 last:pb-0">
      <div className="min-w-0 flex-1">
        <Link
          to={matchPath}
          className="block truncate text-sm font-medium text-slate-900 transition hover:text-blue-600"
        >
          {application.job.title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {application.job.company}
          {missingPreview.length > 0
            ? ` · Missing: ${missingPreview.join(", ")}`
            : ""}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0 tabular-nums">
        <div className="text-right">
          <p className="text-xs font-medium text-slate-700">
            {STATUS_LABEL[application.status]}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {application.matchScore != null
              ? `${Math.round(application.matchScore)}% match`
              : "No score yet"}
          </p>
        </div>
        <Link
          to={matchPath}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
        >
          View match
        </Link>
      </div>
    </li>
  );
};

const ResumeCard: React.FC = () => {
  const { data, isLoading, isError, refetch } = useResumes();
  const latest = data?.[0];

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="resume-heading"
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2
            id="resume-heading"
            className="text-base font-semibold text-slate-900"
          >
            Active Resume
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Used for job requirement matching
          </p>
        </div>
        {latest && (
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Parsed
          </span>
        )}
      </div>

      {isLoading && (
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-slate-100" />
      )}

      {isError && (
        <div role="alert" className="mt-4 text-sm text-red-700">
          <p>We could not load your resume.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && !latest && (
        <div className="mt-5">
          <p className="text-sm text-slate-600">
            Upload your resume to see which skills match your target roles.
          </p>
          <Link
            to="/resume"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            Upload resume
          </Link>
        </div>
      )}

      {latest && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <p className="truncate text-sm font-medium text-slate-900">
              {latest.fileName ?? latest.title}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              Uploaded {new Date(latest.createdAt).toLocaleDateString()} ·{" "}
              {latest.skills.length} extracted skills
            </p>
          </div>

          {latest.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {latest.skills.slice(0, 8).map((skill: string) => (
                <span
                  key={skill}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                >
                  {skill}
                </span>
              ))}
              {latest.skills.length > 8 && (
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  +{latest.skills.length - 8}
                </span>
              )}
            </div>
          )}

          <Link
            to="/resume"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
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
  const { data: applications } = useApplications();
  const { data: readiness } = useReadiness();

  const latestResume = resumes?.[0];
  const latestResumeId = latestResume?.id;
  const firstName = user?.name?.split(" ")[0];

  const [interviews, setInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    fetchUserInterviews()
      .then((list: Interview[]) => setInterviews(list))
      .catch(() => {});
  }, []);

  const leftOffInterview = useMemo(
    () =>
      interviews.find((i: Interview) => i.status === "IN_PROGRESS") ??
      interviews.find((i: Interview) => i.status === "SCHEDULED") ??
      null,
    [interviews],
  );

  const stats = useMemo(() => {
    const verifiedCount =
      readiness?.skills.filter((s) => s.status === "STRONG").length ?? 0;
    const needsPracticeCount =
      readiness?.skills.filter((s) => s.status === "WEAK").length ?? 0;
    const activeAppsCount = (applications ?? []).filter(
      (a) => a.status !== "REJECTED",
    ).length;
    const readinessScore =
      readiness?.defenseSummary?.defensibilityPct ??
      (verifiedCount + needsPracticeCount > 0
        ? Math.round(
            (verifiedCount / (verifiedCount + needsPracticeCount)) * 100,
          )
        : 0);

    return {
      readinessScore,
      verifiedCount,
      needsPracticeCount,
      activeAppsCount,
    };
  }, [readiness, applications]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* 1. Welcome Header */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Here is your current interview readiness and recommended next
              step.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/jobs"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              Continue preparation
            </Link>
            <Link
              to="/applications"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              View applications
            </Link>
          </div>
        </header>

        {/* 2. Readiness Overview Metrics */}
        {/* 2. Readiness Overview Metrics */}
        <section
          aria-label="Readiness overview"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="interactive-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Overall Readiness Score
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-blue-600 tabular-nums">
              <CountUpNumber value={stats.readinessScore} suffix="%" />
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Based on verified skill evidence
            </p>
          </div>

          <div className="interactive-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Skills Verified
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-emerald-600 tabular-nums">
              <CountUpNumber value={stats.verifiedCount} />
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Demonstrated in mock interviews
            </p>
          </div>

          <div className="interactive-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Skills Needing Practice
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-amber-600 tabular-nums">
              <CountUpNumber value={stats.needsPracticeCount} />
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Flagged in interview evaluations
            </p>
          </div>

          <div className="interactive-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Active Applications
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900 tabular-nums">
              <CountUpNumber value={stats.activeAppsCount} />
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Tracked in your job pipeline
            </p>
          </div>
        </section>

        {leftOffInterview && (
          <section className="interactive-card flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0b0f19] p-5 text-white shadow-md">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>
                  {leftOffInterview.status === "IN_PROGRESS"
                    ? "Left-Off Interview · Resume Session"
                    : "Scheduled Interview · Ready to Start"}
                </span>
              </div>
              <h2 className="mt-1.5 text-base font-semibold text-white">
                {leftOffInterview.plan?.role ?? leftOffInterview.title}
                {leftOffInterview.plan?.company
                  ? ` · ${leftOffInterview.plan.company}`
                  : ""}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {
                  leftOffInterview.questions.filter(
                    (q: InterviewQuestion) => q.feedback !== null,
                  ).length
                }{" "}
                of {leftOffInterview.questions.length} questions completed ·{" "}
                {leftOffInterview.plan?.estimatedDuration ?? 30}m ·{" "}
                {leftOffInterview.plan?.difficulty ?? "MEDIUM"}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                to={
                  leftOffInterview.status === "IN_PROGRESS"
                    ? `/interviews/${leftOffInterview.id}/live`
                    : `/interviews/${leftOffInterview.id}/prep`
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>
                  {leftOffInterview.status === "IN_PROGRESS"
                    ? "Resume Left-Off"
                    : "Start Interview"}
                </span>
              </Link>
              <Link
                to="/interviews"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                All Sessions ({interviews.length})
              </Link>
            </div>
          </section>
        )}

        {/* 3. Next Best Action, Top Skill Gaps & Interview Progress */}
        <ReadinessPanel />

        {/* 4. Recommended Roles & Active Resume */}
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
