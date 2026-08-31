//client/src/features/matching/MatchResult.tsx
import type { MatchResult as MatchResultType } from "./types";

interface MatchResultProps {
  result: MatchResultType;
}

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Partial Match";
  return "Low Match";
};

export default function MatchResult({ result }: MatchResultProps) {
  return (
    <section className="space-y-6">
      {/* Score */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Overall Match</p>

            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-bold text-white">
                {result.score}%
              </span>

              <span className="mb-2 text-sm text-gray-400">
                {getScoreLabel(result.score)}
              </span>
            </div>
          </div>

          <div className="h-20 w-20 rounded-full border-4 border-emerald-500 flex items-center justify-center">
            <span className="text-lg font-semibold text-emerald-400">
              {result.score}%
            </span>
          </div>
        </div>
      </div>

      {/* Skill coverage */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Matched Skills</p>

          <p className="mt-2 text-3xl font-bold text-white">
            {result.matchedSkills.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Missing Skills</p>

          <p className="mt-2 text-3xl font-bold text-white">
            {result.missingSkills.length}
          </p>
        </div>
      </div>

      {/* Skill gaps */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-semibold text-white">
          Priority Skill Gaps
        </h2>

        {result.skillGaps.length === 0 ? (
          <p className="mt-4 text-emerald-400">
            No skill gaps found for this job.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {result.skillGaps.map((gap) => (
              <div
                key={gap.skill}
                className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-950 p-4"
              >
                <span className="font-medium text-white">{gap.skill}</span>

                <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase text-red-400">
                  {gap.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Matched skills */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-xl font-semibold text-white">Matched Skills</h2>

        {result.matchedSkills.length === 0 ? (
          <p className="mt-4 text-gray-400">No required skills matched.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {result.matchedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-400"
              >
                ✓ {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
