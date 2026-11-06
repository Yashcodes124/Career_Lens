import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Crosshair,
  Clock,
  RotateCw,
  Check,
  X,
} from "lucide-react";
import { Navbar } from "../../components/NavBar";
import { useReadiness } from "./useReadiness";
import { useResumes } from "../resume/useResumes";
import { useApplications } from "../tracker/useApplications";
import type { Application } from "../tracker/types";

type SkillStatusFilter =
  "ALL" | "VERIFIED" | "NEEDS_PRACTICE" | "RESUME_EXTRACTED" | "MISSING_GAP";

interface UnifiedSkillEntry {
  skill: string;
  level: "VERIFIED" | "NEEDS_PRACTICE" | "RESUME_EXTRACTED" | "MISSING_GAP";
  statusLabel: string;
  evidence: string;
  relatedJobsCount: number;
  updatedAt: string | null;
}

const AREA_KEYWORDS: Record<string, string[]> = {
  Frontend: [
    "react",
    "typescript",
    "javascript",
    "html",
    "css",
    "tailwind",
    "next.js",
    "nextjs",
    "redux",
    "vue",
    "angular",
  ],
  Backend: [
    "node.js",
    "nodejs",
    "express",
    "python",
    "java",
    "go",
    "golang",
    "rust",
    "c#",
    "graphql",
    "rest",
    "api",
    "microservices",
  ],
  Database: [
    "postgresql",
    "postgres",
    "mysql",
    "mongodb",
    "redis",
    "prisma",
    "sql",
    "dynamodb",
  ],
  "System Design": [
    "system design",
    "aws",
    "gcp",
    "azure",
    "docker",
    "kubernetes",
    "ci/cd",
    "kafka",
    "distributed systems",
    "linux",
  ],
  Testing: [
    "testing",
    "jest",
    "vitest",
    "cypress",
    "playwright",
    "unit testing",
    "integration testing",
    "tdd",
  ],
};

const DISMISSED_SKILLS_KEY = "truehire_dismissed_resume_skills";
const CONFIRMED_SKILLS_KEY = "truehire_confirmed_resume_skills";

const readStoredSet = (key: string): Set<string> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? new Set(parsed.map((v) => String(v).toLowerCase()))
      : new Set();
  } catch {
    return new Set();
  }
};

const writeStoredSet = (key: string, values: Set<string>): void => {
  try {
    localStorage.setItem(key, JSON.stringify([...values]));
  } catch {
    // Ignore storage quota errors
  }
};

export const ReadinessPage: React.FC = () => {
  const {
    data: readiness,
    isLoading: readinessLoading,
    isError: readinessError,
    refetch,
  } = useReadiness();
  const { data: resumes, isLoading: resumesLoading } = useResumes();
  const { data: applications, isLoading: appsLoading } = useApplications();

  const [filter, setFilter] = useState<SkillStatusFilter>("ALL");
  const [dismissedSkills, setDismissedSkills] = useState<Set<string>>(() =>
    readStoredSet(DISMISSED_SKILLS_KEY),
  );
  const [confirmedSkills, setConfirmedSkills] = useState<Set<string>>(() =>
    readStoredSet(CONFIRMED_SKILLS_KEY),
  );

  const latestResume = resumes?.[0];

  const handleConfirmSkill = (skill: string) => {
    const key = skill.toLowerCase();
    const nextConfirmed = new Set(confirmedSkills);
    nextConfirmed.add(key);
    setConfirmedSkills(nextConfirmed);
    writeStoredSet(CONFIRMED_SKILLS_KEY, nextConfirmed);

    if (dismissedSkills.has(key)) {
      const nextDismissed = new Set(dismissedSkills);
      nextDismissed.delete(key);
      setDismissedSkills(nextDismissed);
      writeStoredSet(DISMISSED_SKILLS_KEY, nextDismissed);
    }
  };

  const handleDismissSkill = (skill: string) => {
    const key = skill.toLowerCase();
    const nextDismissed = new Set(dismissedSkills);
    nextDismissed.add(key);
    setDismissedSkills(nextDismissed);
    writeStoredSet(DISMISSED_SKILLS_KEY, nextDismissed);
  };

  const handleRestoreDismissed = () => {
    const empty = new Set<string>();
    setDismissedSkills(empty);
    writeStoredSet(DISMISSED_SKILLS_KEY, empty);
  };

  const unifiedSkills = useMemo<UnifiedSkillEntry[]>(() => {
    const map = new Map<string, UnifiedSkillEntry>();
    const gapCounts = new Map<string, number>();

    for (const app of applications ?? []) {
      for (const gap of app.skillGaps ?? []) {
        const key = gap.toLowerCase().trim();
        if (key) {
          gapCounts.set(key, (gapCounts.get(key) ?? 0) + 1);
        }
      }
    }

    for (const item of readiness?.skills ?? []) {
      const key = item.skill.toLowerCase().trim();
      const relatedCount = gapCounts.get(key) ?? 0;

      if (item.status === "STRONG") {
        map.set(key, {
          skill: item.skill,
          level: "VERIFIED",
          statusLabel: "Verified",
          evidence:
            item.evidence || "Demonstrated in a targeted mock interview",
          relatedJobsCount: relatedCount,
          updatedAt: item.updatedAt,
        });
      } else {
        map.set(key, {
          skill: item.skill,
          level: "NEEDS_PRACTICE",
          statusLabel: "Weak · Needs practice",
          evidence:
            item.evidence || "Flagged for improvement in a mock interview",
          relatedJobsCount: relatedCount,
          updatedAt: item.updatedAt,
        });
      }
    }

    for (const rawSkill of latestResume?.skills ?? []) {
      const key = rawSkill.toLowerCase().trim();
      if (!key || dismissedSkills.has(key) || map.has(key)) continue;

      const isConfirmed = confirmedSkills.has(key);
      map.set(key, {
        skill: rawSkill,
        level: "RESUME_EXTRACTED",
        statusLabel: isConfirmed
          ? "Practiced (Confirmed)"
          : "Extracted from resume",
        evidence: isConfirmed
          ? `Confirmed on ${latestResume?.fileName ?? "active resume"}`
          : `Extracted from ${latestResume?.fileName ?? "active resume"} — not yet tested in an interview`,
        relatedJobsCount: gapCounts.get(key) ?? 0,
        updatedAt: latestResume?.createdAt ?? null,
      });
    }

    for (const [gapKey, count] of gapCounts.entries()) {
      if (map.has(gapKey)) continue;
      map.set(gapKey, {
        skill: gapKey,
        level: "MISSING_GAP",
        statusLabel: "Not started",
        evidence: `Required in ${count} tracked ${
          count === 1 ? "application" : "applications"
        }`,
        relatedJobsCount: count,
        updatedAt: null,
      });
    }

    const orderWeight: Record<UnifiedSkillEntry["level"], number> = {
      NEEDS_PRACTICE: 0,
      VERIFIED: 1,
      RESUME_EXTRACTED: 2,
      MISSING_GAP: 3,
    };

    return [...map.values()].sort(
      (a, b) =>
        orderWeight[a.level] - orderWeight[b.level] ||
        b.relatedJobsCount - a.relatedJobsCount ||
        a.skill.localeCompare(b.skill),
    );
  }, [readiness, latestResume, applications, dismissedSkills, confirmedSkills]);

  const counts = useMemo(() => {
    const verified = unifiedSkills.filter((s) => s.level === "VERIFIED").length;
    const needsPractice = unifiedSkills.filter(
      (s) => s.level === "NEEDS_PRACTICE",
    ).length;
    const extracted = unifiedSkills.filter(
      (s) => s.level === "RESUME_EXTRACTED",
    ).length;
    const missing = unifiedSkills.filter(
      (s) => s.level === "MISSING_GAP",
    ).length;

    const totalCandidateSkills = verified + needsPractice + extracted;
    const score =
      readiness?.defenseSummary?.defensibilityPct ??
      (totalCandidateSkills > 0
        ? Math.round(
            ((verified * 1.0 + extracted * 0.5) / totalCandidateSkills) * 100,
          )
        : 0);

    const levelLabel =
      score >= 75
        ? "Interview-Ready"
        : score >= 45
          ? "Practiced"
          : totalCandidateSkills > 0
            ? "Learning"
            : "Not Started";

    return {
      verified,
      needsPractice,
      extracted,
      missing,
      score,
      levelLabel,
    };
  }, [unifiedSkills, readiness]);

  const areaReadiness = useMemo(() => {
    return Object.entries(AREA_KEYWORDS).map(([area, keywords]) => {
      const matching = unifiedSkills.filter((entry) =>
        keywords.some((kw) => entry.skill.toLowerCase().includes(kw)),
      );
      const verifiedOrExtracted = matching.filter(
        (m) => m.level === "VERIFIED" || m.level === "RESUME_EXTRACTED",
      ).length;
      const verifiedOnly = matching.filter(
        (m) => m.level === "VERIFIED",
      ).length;
      const pct =
        matching.length > 0
          ? Math.round(
              ((verifiedOnly * 1.0 +
                (verifiedOrExtracted - verifiedOnly) * 0.6) /
                matching.length) *
                100,
            )
          : 0;

      return {
        area,
        totalTracked: matching.length,
        verifiedCount: verifiedOnly,
        pct,
      };
    });
  }, [unifiedSkills]);

  const timelineEvents = useMemo(() => {
    const events: {
      id: string;
      title: string;
      detail: string;
      date: string;
    }[] = [];

    if (latestResume) {
      events.push({
        id: `resume-${latestResume.id}`,
        title: "Resume uploaded",
        detail: `${latestResume.fileName ?? latestResume.title} (${latestResume.skills.length} skills extracted)`,
        date: latestResume.createdAt,
      });
    }

    for (const s of readiness?.skills ?? []) {
      events.push({
        id: `skill-${s.skill}`,
        title:
          s.status === "STRONG"
            ? `Verified ${s.skill} in interview`
            : `Marked ${s.skill} for practice`,
        detail: s.evidence,
        date: s.updatedAt,
      });
    }

    for (const app of (applications ?? []).slice(0, 4) as Application[]) {
      if (app.matchScore != null) {
        events.push({
          id: `app-${app.id}`,
          title: `Matched with ${app.job.title} at ${app.job.company}`,
          detail: `${Math.round(app.matchScore)}% requirement coverage (${
            app.skillGaps?.length ?? 0
          } gaps identified)`,
          date: app.updatedAt,
        });
      }
    }

    return events
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [latestResume, readiness, applications]);

  const filteredSkills =
    filter === "ALL"
      ? unifiedSkills
      : unifiedSkills.filter((s) => s.level === filter);

  const isLoading = readinessLoading || resumesLoading || appsLoading;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Readiness
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Skill Profile & Readiness
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              See how your skills and interview performance are improving over
              time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/jobs"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              Practice with a target role
            </Link>
            <Link
              to="/resume"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Manage resume
            </Link>
          </div>
        </header>

        {readinessError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>We could not load your skill readiness profile.</span>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              <RotateCw className="h-3 w-3" />
              Try again
            </button>
          </div>
        )}

        {/* Overall Readiness Summary */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                Current Readiness Score
              </p>
              <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {counts.levelLabel}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-slate-900 tabular-nums">
                {counts.score}%
              </span>
              <span className="text-xs text-slate-500">
                Weighted across verified and extracted skills
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, counts.score))}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Verified Skills
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-emerald-600 tabular-nums">
              {counts.verified}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Proven in mock interviews
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Weak Skills</p>
            <p className="mt-1.5 text-2xl font-semibold text-amber-600 tabular-nums">
              {counts.needsPractice}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Need targeted practice
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Practiced / Resume
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900 tabular-nums">
              {counts.extracted}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Extracted from active resume
            </p>
          </div>
        </section>

        {/* Recommended Plan */}
        {readiness?.nextAction && (
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Recommended Focus This Week
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {readiness.nextAction.reason}
              </p>
            </div>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <span>Start targeted practice</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        )}

        {/* Skill Profile Table */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Skill Profile
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Confirm or remove AI-extracted skills and review evidence from
                your interviews.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ["ALL", `All (${unifiedSkills.length})`],
                  ["VERIFIED", `Verified (${counts.verified})`],
                  ["NEEDS_PRACTICE", `Weak (${counts.needsPractice})`],
                  ["RESUME_EXTRACTED", `Resume (${counts.extracted})`],
                  ["MISSING_GAP", `Not started (${counts.missing})`],
                ] as [SkillStatusFilter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    filter === key
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {dismissedSkills.size > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-600">
              <span>
                Removed {dismissedSkills.size} extracted{" "}
                {dismissedSkills.size === 1 ? "skill" : "skills"} from view.
              </span>
              <button
                type="button"
                onClick={handleRestoreDismissed}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Restore all
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="mt-4 space-y-2.5">
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
              <p className="text-sm font-medium text-slate-900">
                No skills in this category yet
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Upload your resume or complete a targeted mock interview to
                build your skill profile.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200">
              {filteredSkills.map((item) => {
                const isConfirmed = confirmedSkills.has(
                  item.skill.toLowerCase(),
                );
                return (
                  <li
                    key={item.skill}
                    className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-1 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {item.level === "VERIFIED" && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        )}
                        {item.level === "NEEDS_PRACTICE" && (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                        )}
                        {item.level === "RESUME_EXTRACTED" && (
                          <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                        )}
                        {item.level === "MISSING_GAP" && (
                          <Crosshair className="h-4 w-4 shrink-0 text-red-600" />
                        )}

                        <span className="text-sm font-semibold text-slate-900">
                          {item.skill}
                        </span>

                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                            item.level === "VERIFIED"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : item.level === "NEEDS_PRACTICE"
                                ? "border-amber-200 bg-amber-50 text-amber-800"
                                : item.level === "RESUME_EXTRACTED"
                                  ? "border-slate-200 bg-slate-100 text-slate-700"
                                  : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {item.statusLabel}
                        </span>

                        {item.relatedJobsCount > 0 && (
                          <span className="text-xs text-slate-500 tabular-nums">
                            · Appears in {item.relatedJobsCount} saved{" "}
                            {item.relatedJobsCount === 1 ? "job" : "jobs"}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-600">
                        {item.evidence}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {item.level === "RESUME_EXTRACTED" && (
                        <>
                          {!isConfirmed && (
                            <button
                              type="button"
                              onClick={() => handleConfirmSkill(item.skill)}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <Check className="h-3 w-3" />
                              <span>Confirm</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDismissSkill(item.skill)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {item.level !== "VERIFIED" && (
                        <Link
                          to="/jobs"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <span>Practice skill</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Bottom Grid: Readiness by Area + Evidence Timeline */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Readiness by Area
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Coverage across core software engineering domains
            </p>

            <div className="mt-4 space-y-4">
              {areaReadiness.map((item) => (
                <div key={item.area} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">
                      {item.area}
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      {item.verifiedCount} verified / {item.totalTracked}{" "}
                      tracked
                      {" · "}
                      <strong className="text-slate-900">{item.pct}%</strong>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Evidence Timeline
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Recent updates to your readiness profile
                </p>
              </div>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>

            {timelineEvents.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                Upload a resume or complete a mock interview to start recording
                readiness milestones.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {timelineEvents.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900">
                        {ev.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-600">
                        {ev.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                      {new Date(ev.date).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default ReadinessPage;
