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
  high: "bg-red-500/10 text-red-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-blue-500/10 text-blue-400",
};

export default function MatchResult({ result }: MatchResultProps) {
  if (result.status === "INSUFFICIENT_DATA" || result.score === null) {
    return (
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-semibold text-white">Not enough job data to score</h2>
        <p className="mt-2 text-gray-400">
          This posting does not list skills we can compare with your resume. No score is
          shown rather than a guessed one.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <p className="text-sm text-gray-400">Overall Match</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-5xl font-bold text-white">{result.score}%</span>
          <span className="mb-2 text-sm text-gray-400">{getScoreLabel(result.score)}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Matched Skills</p>
          <p className="mt-2 text-3xl font-bold text-white">{result.matchedSkills.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Missing Skills</p>
          <p className="mt-2 text-3xl font-bold text-white">{result.missingSkills.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-semibold text-white">Priority Skill Gaps</h2>
        {result.skillGaps.length === 0 ? (
          <p className="mt-4 text-emerald-400">No skill gaps found for this job.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {result.skillGaps.map((gap) => (
              <li
                key={gap.skill}
                className="flex items-start justify-between gap-4 rounded-xl border border-gray-800 bg-gray-950 p-4"
              >
                <div>
                  <span className="font-medium text-white">{gap.skill}</span>
                  <p className="mt-1 text-xs text-gray-400">{gap.evidence}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase ${PRIORITY_CLASSES[gap.priority]}`}
                >
                  {gap.priority} priority
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-semibold text-white">Matched Skills</h2>
        {result.matchedSkills.length === 0 ? (
          <p className="mt-4 text-gray-400">No required skills matched.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {result.matchedSkills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-400"
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
