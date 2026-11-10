import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Crosshair,
  FileText,
  X,
} from "lucide-react";
import { useReadiness } from "./useReadiness";
import { useResumes } from "../resume/useResumes";
import { useApplications } from "../tracker/useApplications";
import type { Application } from "../tracker/types";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  ProgressBar,
  ScoreRing,
  SectionCard,
  Skeleton,
  SkillBadge,
  type SkillReadinessLevel,
} from "../../components/ui";

type SkillStatusFilter =
  "ALL" | "VERIFIED" | "NEEDS_PRACTICE" | "RESUME_EXTRACTED" | "MISSING_GAP";

interface UnifiedSkillEntry {
  skill: string;
  level: "VERIFIED" | "NEEDS_PRACTICE" | "RESUME_EXTRACTED" | "MISSING_GAP";
  badgeLevel: SkillReadinessLevel;
  statusLabel: string;
  evidenceSource: string;
  evidenceDetail: string;
  relatedJobsCount: number;
  updatedAt: string | null;
  recommendedAction: string;
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
  "System Design & Cloud": [
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
  "Testing & Quality": [
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
  const navigate = useNavigate();
  const location = useLocation();
  const isSkillsRoute = location.pathname === "/skills";

  const {
    data: readiness,
    isLoading: readinessLoading,
    isError: readinessError,
    refetch,
  } = useReadiness();
  const { data: resumes, isLoading: resumesLoading } = useResumes();
  const { data: applications, isLoading: appsLoading } = useApplications();

  const [filter, setFilter] = useState<SkillStatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
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

    // 1. Interview-evaluated skills (STRONG / WEAK)
    for (const item of readiness?.skills ?? []) {
      const key = item.skill.toLowerCase().trim();
      const relatedCount = gapCounts.get(key) ?? 0;

      if (item.status === "STRONG") {
        map.set(key, {
          skill: item.skill,
          level: "VERIFIED",
          badgeLevel: "VERIFIED",
          statusLabel: "Verified in interview",
          evidenceSource: "Mock Interview Evaluation",
          evidenceDetail:
            item.evidence ||
            "Demonstrated strong competency in a rubric-scored mock interview.",
          relatedJobsCount: relatedCount,
          updatedAt: item.updatedAt,
          recommendedAction: "Verified — ready for technical screens",
        });
      } else {
        map.set(key, {
          skill: item.skill,
          level: "NEEDS_PRACTICE",
          badgeLevel: "WEAK",
          statusLabel: "Needs practice",
          evidenceSource: "Mock Interview Evaluation",
          evidenceDetail:
            item.evidence ||
            "Flagged for deeper practice during a mock interview assessment.",
          relatedJobsCount: relatedCount,
          updatedAt: item.updatedAt,
          recommendedAction: "Practice in a 15-minute targeted mock interview",
        });
      }
    }

    // 2. Resume-extracted skills (not yet interview-tested)
    for (const rawSkill of latestResume?.skills ?? []) {
      const key = rawSkill.toLowerCase().trim();
      if (!key || dismissedSkills.has(key) || map.has(key)) continue;

      const isConfirmed = confirmedSkills.has(key);
      const resumeTitle =
        latestResume?.fileName ?? latestResume?.title ?? "active resume";

      map.set(key, {
        skill: rawSkill,
        level: "RESUME_EXTRACTED",
        badgeLevel: isConfirmed ? "PRACTICED" : "EXTRACTED",
        statusLabel: isConfirmed
          ? "Confirmed on resume"
          : "Extracted from resume",
        evidenceSource: isConfirmed
          ? `Candidate Confirmed · ${resumeTitle}`
          : `Resume Parser · ${resumeTitle}`,
        evidenceDetail: isConfirmed
          ? `Confirmed by you from ${resumeTitle}. Complete a mock interview to upgrade to Verified.`
          : `Extracted from ${resumeTitle}. Confirm accuracy or test in a mock interview.`,
        relatedJobsCount: gapCounts.get(key) ?? 0,
        updatedAt: latestResume?.createdAt ?? null,
        recommendedAction: isConfirmed
          ? "Verify in a mock interview"
          : "Confirm skill or verify in interview",
      });
    }

    // 3. Missing skills across tracked job applications
    for (const [gapKey, count] of gapCounts.entries()) {
      if (map.has(gapKey)) continue;
      map.set(gapKey, {
        skill: gapKey,
        level: "MISSING_GAP",
        badgeLevel: "MISSING",
        statusLabel: "Missing requirement",
        evidenceSource: "Job Requirement Comparison",
        evidenceDetail: `Required in ${count} tracked ${
          count === 1 ? "application" : "applications"
        } but not found on your active resume or interview history.`,
        relatedJobsCount: count,
        updatedAt: null,
        recommendedAction: "Practice skill in a targeted interview",
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
          ? "Building Evidence"
          : totalCandidateSkills > 0
            ? "Early Preparation"
            : "No Evidence Yet";

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
      tone: "success" | "warning" | "primary";
    }[] = [];

    if (latestResume) {
      events.push({
        id: `resume-${latestResume.id}`,
        title: "Resume uploaded & parsed",
        detail: `${latestResume.fileName ?? latestResume.title} (${latestResume.skills.length} skills extracted)`,
        date: latestResume.createdAt,
        tone: "primary",
      });
    }

    for (const s of readiness?.skills ?? []) {
      events.push({
        id: `skill-${s.skill}-${s.updatedAt}`,
        title:
          s.status === "STRONG"
            ? `Verified ${s.skill} in interview`
            : `Flagged ${s.skill} for practice`,
        detail: s.evidence,
        date: s.updatedAt,
        tone: s.status === "STRONG" ? "success" : "warning",
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
          tone: "primary",
        });
      }
    }

    return events
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [latestResume, readiness, applications]);

  const filteredSkills = useMemo(() => {
    return unifiedSkills.filter((item) => {
      const matchesFilter = filter === "ALL" || item.level === filter;
      const matchesSearch =
        !searchQuery.trim() ||
        item.skill.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        item.evidenceDetail
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [unifiedSkills, filter, searchQuery]);

  const isLoading = readinessLoading || resumesLoading || appsLoading;

  const summaryMetrics = [
    {
      key: "VERIFIED" as SkillStatusFilter,
      label: "Verified Skills",
      value: counts.verified,
      explanation: "Proven through rubric-scored mock interview answers.",
      actionLabel: "Filter verified",
      tone: "text-status-success",
    },
    {
      key: "NEEDS_PRACTICE" as SkillStatusFilter,
      label: "Needs Practice",
      value: counts.needsPractice,
      explanation:
        "Flagged weak in mock interviews — highest priority to review.",
      actionLabel: "Filter weak skills",
      tone: "text-status-warning",
    },
    {
      key: "RESUME_EXTRACTED" as SkillStatusFilter,
      label: "Resume Extracted",
      value: counts.extracted,
      explanation: "Listed on your active resume awaiting interview proof.",
      actionLabel: "Review & confirm",
      tone: "text-primary",
    },
    {
      key: "MISSING_GAP" as SkillStatusFilter,
      label: "Target Role Gaps",
      value: counts.missing,
      explanation:
        "Required by your tracked jobs but missing from your profile.",
      actionLabel: "Inspect missing gaps",
      tone: "text-status-danger",
    },
  ];

  return (
    <ContentContainer size="xl" className="space-y-6">
      <PageHeader
        eyebrow={
          isSkillsRoute
            ? "Skills & Verification Ledger"
            : "Evidence-Based Readiness Profile"
        }
        title={
          isSkillsRoute
            ? "Skills & Evidence Ledger"
            : "Readiness & Skill Evidence"
        }
        description="Inspect the exact evidence behind every skill on your profile, confirm or remove extracted resume skills, and see which gaps appear across your target roles."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => navigate("/jobs")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Practice with a target role
          </Button>
        }
        secondaryActions={
          <Button variant="outline" onClick={() => navigate("/resume")}>
            Manage resume
          </Button>
        }
      />

      {readinessError && (
        <ErrorState
          title="Could not load your skill readiness profile"
          message="Please retry to fetch your latest interview and skill evidence."
          onRetry={() => void refetch()}
        />
      )}

      {/* 1. Overall Readiness Score + 4 Actionable Status Metric Cards */}
      <section className="grid gap-4 lg:grid-cols-12">
        <Card
          padding="md"
          className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center lg:col-span-4"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                Overall Readiness
              </span>
              <Badge tone="primary" size="sm">
                {counts.levelLabel}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-content-secondary">
              {readiness?.nextAction?.reason ||
                "Weighted across interview-verified skills and confirmed resume claims."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/interviews")}
            >
              Open interview hub
            </Button>
          </div>
          <ScoreRing score={counts.score} size={84} label="Readiness" />
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
          {summaryMetrics.map((metric) => (
            <Card
              key={metric.key}
              padding="sm"
              className="flex flex-col justify-between space-y-2.5"
            >
              <div className="space-y-1">
                <p className="text-xs font-medium text-content-secondary">
                  {metric.label}
                </p>
                {isLoading ? (
                  <Skeleton className="h-7 w-14" />
                ) : (
                  <p
                    className={`text-2xl font-semibold tracking-tight tabular-nums ${metric.tone}`}
                  >
                    {metric.value}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-content-secondary">
                  {metric.explanation}
                </p>
              </div>
              <div className="border-t border-border pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setFilter((prev) =>
                      prev === metric.key ? "ALL" : metric.key,
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                >
                  <span>
                    {filter === metric.key
                      ? "Show all skills"
                      : metric.actionLabel}
                  </span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Skill Profile & Evidence Ledger */}
      <SectionCard
        eyebrow="Traceable Skill Status"
        title="Skill Profile & Evidence Ledger"
        description="Every skill lists its status, where the evidence came from, how many saved jobs require it, and your next step."
      >
        <div className="space-y-4">
          {/* Filter Pills & Search */}
          <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ["ALL", `All (${unifiedSkills.length})`],
                  ["VERIFIED", `Verified (${counts.verified})`],
                  [
                    "NEEDS_PRACTICE",
                    `Needs Practice (${counts.needsPractice})`,
                  ],
                  ["RESUME_EXTRACTED", `Resume (${counts.extracted})`],
                  ["MISSING_GAP", `Role Gaps (${counts.missing})`],
                ] as [SkillStatusFilter, string][]
              ).map(([key, label]) => (
                <Button
                  key={key}
                  variant={filter === key ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Search skill or evidence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter skills by name or evidence"
              />
            </div>
          </div>

          {dismissedSkills.size > 0 && (
            <Card
              muted
              padding="sm"
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span className="text-xs text-content-secondary">
                You removed {dismissedSkills.size} extracted{" "}
                {dismissedSkills.size === 1 ? "skill" : "skills"} from your
                active profile.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestoreDismissed}
              >
                Restore removed skills
              </Button>
            </Card>
          )}

          {isLoading ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredSkills.length === 0 ? (
            <EmptyState
              title="No skills match this filter"
              description="Upload a resume or complete a targeted mock interview to populate your skill evidence ledger."
              action={
                filter !== "ALL" || searchQuery ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilter("ALL");
                      setSearchQuery("");
                    }}
                  >
                    Reset filters
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate("/resume")}
                  >
                    Upload resume
                  </Button>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {filteredSkills.map((item) => {
                const isConfirmed = confirmedSkills.has(
                  item.skill.toLowerCase(),
                );
                return (
                  <li
                    key={item.skill}
                    className="flex flex-col justify-between gap-4 py-4 first:pt-1 last:pb-0 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.level === "VERIFIED" && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-status-success" />
                        )}
                        {item.level === "NEEDS_PRACTICE" && (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-status-warning" />
                        )}
                        {item.level === "RESUME_EXTRACTED" && (
                          <FileText className="h-4 w-4 shrink-0 text-primary" />
                        )}
                        {item.level === "MISSING_GAP" && (
                          <Crosshair className="h-4 w-4 shrink-0 text-status-danger" />
                        )}

                        <span className="text-sm font-semibold text-content-heading">
                          {item.skill}
                        </span>

                        <SkillBadge
                          skill={item.skill}
                          level={item.badgeLevel}
                          meta={item.statusLabel}
                        />

                        <Badge tone="neutral" size="sm">
                          Source: {item.evidenceSource}
                        </Badge>

                        {item.relatedJobsCount > 0 && (
                          <Badge tone="primary" size="sm">
                            Required in {item.relatedJobsCount} saved{" "}
                            {item.relatedJobsCount === 1 ? "role" : "roles"}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs leading-relaxed text-content-body">
                        <strong className="font-medium text-content-heading">
                          Evidence:{" "}
                        </strong>
                        {item.evidenceDetail}
                      </p>

                      {item.updatedAt && (
                        <p className="text-[11px] text-content-secondary tabular-nums">
                          Recorded{" "}
                          {new Date(item.updatedAt).toLocaleDateString()} ·{" "}
                          {item.recommendedAction}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {item.level === "RESUME_EXTRACTED" && (
                        <>
                          {!isConfirmed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfirmSkill(item.skill)}
                              leftIcon={<Check className="h-3.5 w-3.5" />}
                            >
                              Confirm skill
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismissSkill(item.skill)}
                            leftIcon={<X className="h-3.5 w-3.5" />}
                          >
                            Remove
                          </Button>
                        </>
                      )}

                      {item.level !== "VERIFIED" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate("/jobs")}
                          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        >
                          Practice skill
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SectionCard>

      {/* 3. Domain Readiness & Evidence Timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          eyebrow="Engineering Domains"
          title="Readiness by Technical Area"
          description="Domain coverage across your verified interview skills and extracted resume profile."
        >
          <div className="space-y-4">
            {areaReadiness.map((item) => (
              <div key={item.area} className="space-y-1.5">
                <ProgressBar
                  label={`${item.area} (${item.verifiedCount} verified / ${item.totalTracked} tracked)`}
                  value={item.pct}
                  tone={
                    item.pct >= 70
                      ? "success"
                      : item.pct >= 40
                        ? "primary"
                        : "warning"
                  }
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Audit Trail"
          title="Evidence Timeline"
          description="Chronological log of resume extractions, job matches, and interview skill updates."
          empty={timelineEvents.length === 0}
          emptyTitle="No readiness milestones yet"
          emptyDescription="Upload a resume or complete a mock interview to record your first evidence milestone."
        >
          <ul className="space-y-3">
            {timelineEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex items-start justify-between gap-3 rounded-card border border-border bg-muted/40 p-3.5"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={ev.tone} size="sm">
                      Evidence
                    </Badge>
                    <p className="text-xs font-semibold text-content-heading">
                      {ev.title}
                    </p>
                  </div>
                  <p className="text-xs text-content-secondary">{ev.detail}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-content-secondary tabular-nums">
                  <Clock className="h-3 w-3" />
                  {new Date(ev.date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </ContentContainer>
  );
};

export default ReadinessPage;
