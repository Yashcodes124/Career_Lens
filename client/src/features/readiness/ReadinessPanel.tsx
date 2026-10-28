import { Link } from "react-router-dom";
import { ArrowUpRight, RotateCw } from "lucide-react";
import { NextAction } from "./readinessApi";
import { useReadiness } from "./useReadiness";

const actionLink = (
  action: NextAction,
): { to: string; label: string } | null => {
  switch (action.type) {
    case "UPLOAD_RESUME":
      return { to: "/resume", label: "Upload a resume" };
    case "PRACTICE_SKILL":
      return { to: "/jobs", label: `Find a job to practise ${action.skill}` };
    case "EXPLORE_JOBS":
      return { to: "/jobs", label: "Browse verified jobs" };
    case "START_INTERVIEW":
      return { to: "/jobs", label: "Pick a matched job" };
  }
};

export function ReadinessPanel() {
  const { data, isLoading, isError, refetch } = useReadiness();

  const weakSkills = data?.skills.filter((s) => s.status === "WEAK") ?? [];
  const strongSkills = data?.skills.filter((s) => s.status === "STRONG") ?? [];
  const cta = data ? actionLink(data.nextAction) : null;

  return (
    <section
      aria-labelledby="next-step-heading"
      className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-teal-400" />
          <h2
            id="next-step-heading"
            className="text-sm font-semibold uppercase tracking-wider text-zinc-200"
          >
            Your next step
          </h2>
        </div>

        {data && (
          <div className="flex items-center gap-4 font-mono text-xs text-zinc-400 tabular-nums">
            <span>
              VERIFIED_STRONG:{" "}
              <strong className="text-emerald-400">
                {strongSkills.length}
              </strong>
            </span>
            <span>
              FLAGGED_WEAK:{" "}
              <strong className="text-amber-400">{weakSkills.length}</strong>
            </span>
          </div>
        )}
      </div>

      {isLoading && (
        <p className="mt-4 font-mono text-xs text-zinc-400">
          Checking your progress...
        </p>
      )}

      {isError && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-300"
        >
          <span>We could not load your next step.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 px-3 py-1 text-xs font-medium text-red-200 hover:bg-red-500/10"
          >
            <RotateCw className="h-3 w-3" />
            Try again
          </button>
        </div>
      )}

      {data && (
        <div className="mt-5 grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-base font-medium leading-relaxed text-zinc-100">
              {data.nextAction.reason}
            </p>
            {cta && (
              <Link
                to={cta.to}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-teal-400 active:scale-[0.98]"
              >
                <span>{cta.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="lg:col-span-5">
            {weakSkills.length > 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-[#09090b] p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                  Flagged in mock interviews
                </p>
                <ul className="mt-2.5 divide-y divide-zinc-800/80">
                  {weakSkills.map((s) => (
                    <li
                      key={s.skill}
                      className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-medium text-zinc-100">
                          {s.skill}
                        </span>
                        {s.evidence && (
                          <span className="block truncate text-[11px] text-zinc-500">
                            {s.evidence}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-amber-300">
                        Weak
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-800/70 bg-[#09090b]/60 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  Interview Telemetry
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  No skills are currently flagged weak. Complete a role-specific
                  mock interview to benchmark your readiness.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
