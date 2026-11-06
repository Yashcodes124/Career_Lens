import React, { useState } from "react";
import {
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code2,
  Compass,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import type { GapPriority, MatchResult as MatchResultType } from "./types";
import { getResourcesForSkill, type SkillResourceLink } from "./skillResources";

interface MatchResultProps {
  result: MatchResultType;
}

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Partial match";
  return "Needs preparation";
};

const PRIORITY_CLASSES: Record<GapPriority, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-700",
};

const TYPE_ICON: Record<SkillResourceLink["type"], React.ReactNode> = {
  DOCS: <BookOpen className="h-3.5 w-3.5 text-blue-600" />,
  ROADMAP: <Compass className="h-3.5 w-3.5 text-indigo-600" />,
  PRACTICE: <Code2 className="h-3.5 w-3.5 text-emerald-600" />,
  COURSE: <PlayCircle className="h-3.5 w-3.5 text-amber-600" />,
};

const buildHumanExplanation = (result: MatchResultType): string => {
  const matched = result.matchedSkills;
  const highGaps = result.skillGaps
    .filter((g) => g.priority === "high")
    .map((g) => g.skill);
  const topGaps = (highGaps.length > 0 ? highGaps : result.missingSkills).slice(
    0,
    3,
  );

  if (matched.length === 0 && topGaps.length > 0) {
    return `Your active resume does not yet list the core requirements for this role. Focus first on ${topGaps.join(", ")} before interviewing.`;
  }

  if (topGaps.length === 0) {
    return `You meet all ${matched.length} extracted requirements for this role (${matched.slice(0, 4).join(", ")}). Use a targeted mock interview to verify depth on production trade-offs.`;
  }

  return `You meet ${matched.length} of ${
    matched.length + result.missingSkills.length
  } requirements for this role, led by ${matched
    .slice(0, 3)
    .join(", ")}. Your main gap is ${topGaps.join(", ")}.`;
};

export default function MatchResult({ result }: MatchResultProps) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(() => {
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
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
          Insufficient Job Data
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">
          Not enough job requirements to calculate a score
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          This posting does not list recognizable technical skills we can
          compare with your resume. No score is shown rather than guessing one.
        </p>
      </section>
    );
  }

  const totalCompared =
    result.matchedSkills.length + result.missingSkills.length;
  const fortifiedSet = new Set(result.tactical?.defense.fortifiedSkills ?? []);
  const exposedSet = new Set(result.tactical?.defense.exposedWeaknesses ?? []);
  const explanation = buildHumanExplanation(result);

  return (
    <section className="space-y-6">
      {/* Explanation Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Match Explanation
          </p>
          <span className="text-xs font-medium text-slate-600 tabular-nums">
            You meet {result.matchedSkills.length} of {totalCompared}{" "}
            requirements
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-900">
          {explanation}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-6">
          <p className="text-xs font-medium text-slate-500">
            Requirement Coverage
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {result.score}%
            </span>
            <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {getScoreLabel(result.score)}
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${Math.min(Math.max(result.score, 0), 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="p-6">
          <p className="text-xs font-medium text-slate-500">Matched Skills</p>
          <p className="mt-2 text-4xl font-semibold text-emerald-600 tabular-nums">
            {result.matchedSkills.length}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {fortifiedSet.size > 0
              ? `${fortifiedSet.size} interview-verified · ${
                  result.matchedSkills.length - fortifiedSet.size
                } from resume`
              : "Found on your active resume"}
          </p>
        </div>

        <div className="p-6">
          <p className="text-xs font-medium text-slate-500">Missing Skills</p>
          <p className="mt-2 text-4xl font-semibold text-amber-600 tabular-nums">
            {result.missingSkills.length}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {result.tactical?.offense.projectedScoreAfterTop3
              ? `Practicing top ${Math.min(3, result.missingSkills.length)} raises coverage to ${
                  result.tactical.offense.projectedScoreAfterTop3
                }%`
              : `Out of ${totalCompared} total requirements`}
          </p>
        </div>
      </div>

      {/* Missing Skills & Study Resources */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Missing Skills & Recommended Preparation
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Ranked by mention frequency in the job description and your past
              interview results.
            </p>
          </div>

          {result.skillGaps.length > 0 && (
            <button
              type="button"
              onClick={expandAllResources}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {expandedSkills.size === result.skillGaps.length
                ? "Collapse study links"
                : "Show all study resources"}
            </button>
          )}
        </div>

        {result.skillGaps.length === 0 ? (
          <p className="mt-4 text-sm font-medium text-emerald-700">
            You meet all extracted skill requirements for this role.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {result.skillGaps.map((gap) => {
              const isOpen = expandedSkills.has(gap.skill);
              const resources = getResourcesForSkill(gap.skill);
              const isExposed = exposedSet.has(gap.skill);

              return (
                <li
                  key={gap.skill}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span className="text-sm font-semibold text-slate-900">
                          {gap.skill}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_CLASSES[gap.priority]}`}
                        >
                          {gap.priority} priority
                        </span>
                        {isExposed && (
                          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Needs interview practice
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {gap.evidence}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSkillResources(gap.skill)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                      <span>Learning resources</span>
                      {isOpen ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4">
                      <p className="mb-2.5 text-xs font-medium text-slate-500">
                        Curated learning path for {gap.skill}
                      </p>
                      <div className="grid gap-2.5 sm:grid-cols-3">
                        {resources.map((res) => (
                          <a
                            key={res.url}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 transition hover:border-blue-400"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-500">
                                  {TYPE_ICON[res.type]}
                                  {res.type}
                                </span>
                                <ExternalLink className="h-3 w-3 text-slate-400 transition group-hover:text-blue-600" />
                              </div>
                              <p className="mt-2 text-xs font-semibold leading-snug text-slate-900 group-hover:text-blue-600">
                                {res.title}
                              </p>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                              <span>{res.provider}</span>
                              <span>{res.durationOrLevel}</span>
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
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Matched Skills & Evidence Source
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Requirements met by your active resume or verified in mock
              interviews
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {result.matchedSkills.length} of {totalCompared} met
          </span>
        </div>

        {result.matchedSkills.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            No required skills matched yet.
          </p>
        ) : (
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {result.matchedSkills.map((skill) => {
              const isVerified = fortifiedSet.has(skill);
              return (
                <li
                  key={skill}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isVerified ? (
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                    )}
                    <span className="truncate text-xs font-medium text-slate-900">
                      {skill}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                      isVerified
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {isVerified ? "Interview verified" : "Resume"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
