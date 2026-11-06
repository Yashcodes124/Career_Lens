import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Target,
} from "lucide-react";
import type {
  NextAction,
  ReadinessSkill,
  GlobalOffenseTarget,
} from "./readinessApi";
import { useReadiness } from "./useReadiness";

const actionLink = (action: NextAction): { to: string; label: string } => {
  switch (action.type) {
    case "UPLOAD_RESUME":
      return { to: "/resume", label: "Upload a resume" };
    case "PRACTICE_SKILL":
      return {
        to: "/jobs",
        label: `Practice ${action.skill}`,
      };
    case "EXPLORE_JOBS":
      return { to: "/jobs", label: "Browse verified jobs" };
    case "START_INTERVIEW":
      return { to: "/applications", label: "Start an interview" };
  }
};

export const ReadinessPanel: React.FC = () => {
  const { data, isLoading, isError, refetch } = useReadiness();

  const skills: ReadinessSkill[] = data?.skills ?? [];
  const weakSkills = skills.filter((s: ReadinessSkill) => s.status === "WEAK");
  const strongSkills = skills.filter(
    (s: ReadinessSkill) => s.status === "STRONG",
  );
  const defense = data?.defenseSummary;
  const offenseTargets: GlobalOffenseTarget[] = data?.offenseTargets ?? [];
  const cta = data ? actionLink(data.nextAction) : null;

  return (
    <section
      aria-labelledby="next-step-heading"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2
            id="next-step-heading"
            className="text-base font-semibold text-slate-900"
          >
            Next Best Action & Skill Gaps
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Personalized recommendation based on your resume, saved jobs, and
            recent interviews
          </p>
        </div>

        <Link
          to="/readiness"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View full readiness profile →
        </Link>
      </div>

      {isLoading && (
        <div className="mt-4 space-y-3" role="status">
          <div className="h-16 w-full animate-pulse rounded-lg bg-slate-100" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span>We could not load your readiness recommendation.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            <RotateCw className="h-3 w-3" />
            Try again
          </button>
        </div>
      )}

      {data && (
        <div className="mt-5 space-y-5">
          {/* Primary Next Best Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Recommended Next Step
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900 sm:text-base">
                {data.nextAction.reason}
              </p>
            </div>
            {cta && (
              <Link
                to={cta.to}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                <span>{cta.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Skill Gaps Across Target Jobs */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Top Skill Gaps
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  Across tracked jobs
                </span>
              </div>

              {offenseTargets.length > 0 ? (
                <ul className="mt-3 divide-y divide-slate-200">
                  {offenseTargets.map((target: GlobalOffenseTarget) => (
                    <li
                      key={target.skill}
                      className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {target.skill}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {target.isExposedWeakness
                            ? "Flagged for practice in your last interview"
                            : `Appears in ${target.blockedApplicationsCount} saved ${
                                target.blockedApplicationsCount === 1
                                  ? "job"
                                  : "jobs"
                              }`}
                        </span>
                      </div>
                      <Link
                        to="/jobs"
                        className="shrink-0 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-50 tabular-nums"
                      >
                        Practice this skill
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  Match your resume with verified engineering roles to see which
                  missing skills appear most frequently across your target jobs.
                </p>
              )}
            </div>

            {/* Interview Progress & Weak Areas */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {weakSkills.length > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  <h3 className="text-sm font-semibold text-slate-900">
                    Interview Evidence & Weak Areas
                  </h3>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  {strongSkills.length} verified · {weakSkills.length} needing
                  practice
                </span>
              </div>

              {weakSkills.length > 0 ? (
                <ul className="mt-3 divide-y divide-slate-200">
                  {weakSkills.map((s: ReadinessSkill) => (
                    <li
                      key={s.skill}
                      className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {s.skill}
                        </span>
                        {s.evidence && (
                          <span className="block truncate text-xs text-slate-500">
                            {s.evidence}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Needs practice
                      </span>
                    </li>
                  ))}
                </ul>
              ) : defense && defense.unverifiedSkills.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs text-slate-600">
                    Extracted from your resume and ready to verify in a targeted
                    interview:
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {defense.unverifiedSkills.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : strongSkills.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs text-slate-600">
                    Skills verified in your mock interviews:
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {strongSkills.map((s: ReadinessSkill) => (
                      <span
                        key={s.skill}
                        className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                      >
                        {s.skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  Complete a targeted mock interview to record verified
                  strengths and identify weak areas.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
