import type { GapPriority, MatchResult as MatchResultType } from "./types";

interface MatchResultProps {
  result: MatchResultType;
}

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Partial Match";
  return "Low Match";
};

const PRIORITY_CLASSES: Record<GapPriority, string> = {
  high: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

export default function MatchResult({ result }: MatchResultProps) {
  if (result.status === "INSUFFICIENT_DATA" || result.score === null) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-amber-400">
          STATUS // INSUFFICIENT_JOB_DATA
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">
          Not enough job data to score
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
          This posting does not list canonical skills we can deterministically
          compare with your resume. No score is shown rather than a guessed one.
        </p>
      </section>
    );
  }

  const totalCompared =
    result.matchedSkills.length + result.missingSkills.length;

  return (
    <section className="space-y-6">
      {/* Hairline Telemetry Strip */}
      <div className="grid divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-6">
          <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Overall Match
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-mono text-4xl font-semibold tracking-tight text-white tabular-nums">
              {result.score}%
            </span>
            <span className="text-xs font-medium text-teal-400">
              {getScoreLabel(result.score)}
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-teal-400 transition-all duration-500"
              style={{
                width: `${Math.min(Math.max(result.score, 0), 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="p-6">
          <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Matched Skills
          </p>
          <p className="mt-2 font-mono text-4xl font-semibold text-emerald-400 tabular-nums">
            {result.matchedSkills.length}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Verified on your active resume
          </p>
        </div>

        <div className="p-6">
          <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Missing Skills
          </p>
          <p className="mt-2 font-mono text-4xl font-semibold text-amber-400 tabular-nums">
            {result.missingSkills.length}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Out of {totalCompared} extracted job requirements
          </p>
        </div>
      </div>

      {/* Priority Skill Gaps */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Priority Skill Gaps
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Ranked by job requirement prominence and prior mock interview
              evidence
            </p>
          </div>
          <span className="font-mono text-xs text-zinc-500 tabular-nums">
            {result.skillGaps.length} GAPS
          </span>
        </div>

        {result.skillGaps.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-400">
            No skill gaps found for this job. Your resume covers every extracted
            requirement.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-800/70">
            {result.skillGaps.map((gap) => (
              <li
                key={gap.skill}
                className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div>
                  <span className="text-sm font-medium text-zinc-100">
                    {gap.skill}
                  </span>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {gap.evidence}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${PRIORITY_CLASSES[gap.priority]}`}
                >
                  {gap.priority} priority
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Matched Skills */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <h2 className="text-base font-semibold text-white">Matched Skills</h2>
          <span className="font-mono text-xs text-zinc-500 tabular-nums">
            {result.matchedSkills.length} MATCHED
          </span>
        </div>

        {result.matchedSkills.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">
            No required skills matched.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {result.matchedSkills.map((skill) => (
              <li
                key={skill}
                className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300"
              >
                {skill}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
