import React, { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code2,
  Compass,
  PlayCircle,
} from "lucide-react";
import type { GapPriority, MatchResult as MatchResultType } from "./types";
import { getResourcesForSkill, type SkillResourceLink } from "./skillResources";

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

const TYPE_ICON: Record<SkillResourceLink["type"], React.ReactNode> = {
  DOCS: <BookOpen className="h-3.5 w-3.5 text-teal-400" />,
  ROADMAP: <Compass className="h-3.5 w-3.5 text-sky-400" />,
  PRACTICE: <Code2 className="h-3.5 w-3.5 text-emerald-400" />,
  COURSE: <PlayCircle className="h-3.5 w-3.5 text-amber-400" />,
};

export default function MatchResult({ result }: MatchResultProps) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(() => {
    // Auto-expand the first priority gap so the user immediately sees learning resources
    const first = result.skillGaps?.[0]?.skill;
    return first ? new Set([first]) : new Set();
  });

  const toggleSkillResources = (skill: string) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  };

  const expandAllResources = () => {
    if (expandedSkills.size === result.skillGaps.length) {
      setExpandedSkills(new Set());
    } else {
      setExpandedSkills(new Set(result.skillGaps.map((g) => g.skill)));
    }
  };

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
          This posting does not list skills we can compare with your resume. No
          score is shown rather than a guessed one.
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

      {/* Priority Skill Gaps + Integrated Study & Practice Hub */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Priority Skill Gaps & Study Resources
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Ranked by job requirement frequency. Expand any skill to access
              curated documentation, roadmaps, and practice labs.
            </p>
          </div>

          {result.skillGaps.length > 0 && (
            <button
              type="button"
              onClick={expandAllResources}
              className="rounded-lg border border-zinc-800 bg-[#09090b] px-3 py-1.5 font-mono text-[11px] text-teal-400 transition hover:border-zinc-700 hover:text-teal-300"
            >
              {expandedSkills.size === result.skillGaps.length
                ? "Collapse all study links"
                : "Show all study resources"}
            </button>
          )}
        </div>

        {result.skillGaps.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-400">
            No skill gaps found for this job.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {result.skillGaps.map((gap) => {
              const isOpen = expandedSkills.has(gap.skill);
              const resources = getResourcesForSkill(gap.skill);

              return (
                <li
                  key={gap.skill}
                  className="overflow-hidden rounded-xl border border-zinc-800/90 bg-[#09090b] transition hover:border-zinc-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-sm font-semibold text-white">
                          {gap.skill}
                        </span>
                        <span
                          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${PRIORITY_CLASSES[gap.priority]}`}
                        >
                          {gap.priority} priority
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        {gap.evidence}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSkillResources(gap.skill)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-teal-300 transition hover:border-teal-500/40 hover:text-white"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-teal-400" />
                      <span>Learn & Practice</span>
                      {isOpen ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-zinc-800/80 bg-zinc-900/30 p-4">
                      <p className="mb-2.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                        Curated Free Learning Path for {gap.skill}
                      </p>
                      <div className="grid gap-2.5 sm:grid-cols-3">
                        {resources.map((res) => (
                          <a
                            key={res.url}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col justify-between rounded-lg border border-zinc-800 bg-[#09090b] p-3 transition hover:border-teal-500/50"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase text-zinc-400">
                                  {TYPE_ICON[res.type]}
                                  {res.type}
                                </span>
                                <ExternalLink className="h-3 w-3 text-zinc-500 transition group-hover:text-teal-400" />
                              </div>
                              <p className="mt-2 text-xs font-semibold leading-snug text-zinc-100 group-hover:text-teal-300">
                                {res.title}
                              </p>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-zinc-800/70 pt-2 font-mono text-[10px] text-zinc-500">
                              <span>{res.provider}</span>
                              <span className="text-zinc-400">
                                {res.durationOrLevel}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
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
