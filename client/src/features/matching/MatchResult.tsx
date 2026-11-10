import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Compass,
  ExternalLink,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import type { GapPriority, MatchResult as MatchResultType } from "./types";
import { getResourcesForSkill, type SkillResourceLink } from "./skillResources";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ProgressBar,
  RequirementRow,
  ScoreRing,
  SectionCard,
  SkillBadge,
  Tabs,
  type BadgeTone,
} from "../../components/ui";

export interface MatchResultProps {
  result: MatchResultType;
  jobTitle?: string;
  companyName?: string;
  jobFrequencyMap?: Record<string, number>;
  verifiedSkills?: string[];
  weakSkillsMap?: Record<string, string>;
  onPracticeSkill?: (skill: string) => void;
  onStartTargetedInterview?: () => void;
}

const getReadinessLabel = (
  score: number,
): { label: string; tone: BadgeTone } => {
  if (score >= 80) return { label: "Strong match", tone: "success" };
  if (score >= 60) return { label: "Good match", tone: "primary" };
  if (score >= 40) return { label: "Partial match", tone: "warning" };
  return { label: "Needs preparation", tone: "danger" };
};

const RESOURCE_TYPE_ICON: Record<SkillResourceLink["type"], React.ReactNode> = {
  DOCS: <BookOpen className="h-3.5 w-3.5 text-primary" />,
  ROADMAP: <Compass className="h-3.5 w-3.5 text-primary" />,
  PRACTICE: <Code2 className="h-3.5 w-3.5 text-status-success" />,
  COURSE: <PlayCircle className="h-3.5 w-3.5 text-status-warning" />,
};

const buildWhyThisMatchExplanation = (
  result: MatchResultType,
  roleLabel: string,
  verifiedCount: number,
): string => {
  const matched = result.matchedSkills;
  const total = matched.length + result.missingSkills.length;
  const highPriorityGaps = result.skillGaps
    .filter((g) => g.priority === "high")
    .map((g) => g.skill);
  const topGaps = (
    highPriorityGaps.length > 0 ? highPriorityGaps : result.missingSkills
  ).slice(0, 3);

  if (matched.length === 0 && topGaps.length > 0) {
    return `You currently meet 0 of ${total} extracted requirements for ${roleLabel}. Your active resume does not yet list ${topGaps.join(", ")}. Practice these core gaps in a targeted interview before applying.`;
  }

  if (topGaps.length === 0) {
    return `You are a strong match for ${roleLabel}, meeting all ${matched.length} extracted requirements (${matched.slice(0, 4).join(", ")}). ${
      verifiedCount > 0
        ? `${verifiedCount} of these skills are already verified through mock interview evaluations.`
        : "Start a targeted interview to verify your resume claims with rubric-scored evidence."
    }`;
  }

  const readinessDescriptor =
    (result.score ?? 0) >= 75
      ? "a strong match"
      : (result.score ?? 0) >= 55
        ? "a good match"
        : "a partial match";

  return `You are ${readinessDescriptor} for ${roleLabel} requiring ${matched
    .slice(0, 3)
    .join(
      ", ",
    )} (${matched.length} of ${total} requirements met). Your main preparation gap is ${topGaps.join(
    " and ",
  )}.`;
};

export const MatchResult: React.FC<MatchResultProps> = ({
  result,
  jobTitle,
  companyName,
  jobFrequencyMap = {},
  verifiedSkills = [],
  weakSkillsMap = {},
  onPracticeSkill,
  onStartTargetedInterview,
}) => {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(() => {
    const first = result.skillGaps?.[0]?.skill;
    return first ? new Set([first]) : new Set();
  });
  const [checklistTab, setChecklistTab] = useState<string>("all");

  const toggleSkillResources = (skill: string) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  };

  const toggleAllResources = () => {
    if (expandedSkills.size === result.skillGaps.length) {
      setExpandedSkills(new Set());
    } else {
      setExpandedSkills(new Set(result.skillGaps.map((g) => g.skill)));
    }
  };

  const fortifiedSet = useMemo(() => {
    const fromTactical = result.tactical?.defense.fortifiedSkills ?? [];
    return new Set(
      [...fromTactical, ...verifiedSkills].map((s) => s.toLowerCase().trim()),
    );
  }, [result.tactical, verifiedSkills]);

  const exposedSet = useMemo(() => {
    const fromTactical = result.tactical?.defense.exposedWeaknesses ?? [];
    const fromProps = Object.keys(weakSkillsMap);
    return new Set(
      [...fromTactical, ...fromProps].map((s) => s.toLowerCase().trim()),
    );
  }, [result.tactical, weakSkillsMap]);

  if (result.status === "INSUFFICIENT_DATA" || result.score === null) {
    return (
      <EmptyState
        title="Not enough structured requirements to score this posting"
        description="This job posting does not list specific technical skills we can deterministically compare with your resume. No guessed score is shown."
        action={
          onStartTargetedInterview ? (
            <Button variant="primary" onClick={onStartTargetedInterview}>
              Start targeted interview anyway
            </Button>
          ) : undefined
        }
      />
    );
  }

  const totalRequirements =
    result.matchedSkills.length + result.missingSkills.length;
  const readiness = getReadinessLabel(result.score);

  const verifiedMatchCount = result.matchedSkills.filter((s) =>
    fortifiedSet.has(s.toLowerCase().trim()),
  ).length;
  const resumeOnlyMatchCount = Math.max(
    0,
    result.matchedSkills.length - verifiedMatchCount,
  );
  const partiallyMetSkills = result.missingSkills.filter((s) =>
    exposedSet.has(s.toLowerCase().trim()),
  );
  const strictlyMissingSkills = result.missingSkills.filter(
    (s) => !exposedSet.has(s.toLowerCase().trim()),
  );

  const evidenceStrengthPct =
    result.tactical?.defense.defensibilityScore ??
    (result.matchedSkills.length > 0
      ? Math.round(
          ((verifiedMatchCount * 1.0 + resumeOnlyMatchCount * 0.55) /
            result.matchedSkills.length) *
            100,
        )
      : 0);

  const roleLabel = jobTitle
    ? `${jobTitle}${companyName ? ` at ${companyName}` : ""}`
    : "this role";

  const explanation = buildWhyThisMatchExplanation(
    result,
    roleLabel,
    verifiedMatchCount,
  );

  const priorityToneMap: Record<GapPriority, BadgeTone> = {
    high: "danger",
    medium: "warning",
    low: "neutral",
  };

  return (
    <div className="space-y-6">
      {/* 1. "Why this match?" & Overall Requirement Coverage Summary */}
      <Card padding="lg" className="space-y-6">
        <div className="flex flex-col justify-between gap-6 border-b border-border pb-6 lg:flex-row lg:items-center">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={readiness.tone}>{readiness.label}</Badge>
              <Badge tone="neutral">
                You meet {result.matchedSkills.length} of {totalRequirements}{" "}
                requirements
              </Badge>
            </div>
            <h2 className="text-lg font-semibold text-content-heading sm:text-xl">
              Why this match?
            </h2>
            <p className="text-sm leading-relaxed text-content-body">
              {explanation}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-5">
            <ScoreRing
              score={result.score}
              size={88}
              label="Requirement Match"
            />
          </div>
        </div>

        {/* 4 Actionable Summary Metrics: Requirement Coverage, Matched Skills, Missing Skills, Evidence Strength */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card muted padding="sm" className="space-y-1.5">
            <p className="text-xs font-medium text-content-secondary">
              Requirement Coverage
            </p>
            <p className="text-2xl font-semibold text-content-heading tabular-nums">
              {result.matchedSkills.length} / {totalRequirements}
            </p>
            <p className="text-xs text-content-secondary">
              {result.score}% of extracted role requirements met.
            </p>
          </Card>

          <Card muted padding="sm" className="space-y-1.5">
            <p className="text-xs font-medium text-content-secondary">
              Matched Skills
            </p>
            <p className="text-2xl font-semibold text-status-success tabular-nums">
              {result.matchedSkills.length}
            </p>
            <p className="text-xs text-content-secondary">
              {verifiedMatchCount} interview-verified · {resumeOnlyMatchCount}{" "}
              from active resume.
            </p>
          </Card>

          <Card muted padding="sm" className="space-y-1.5">
            <p className="text-xs font-medium text-content-secondary">
              Missing & Weak Skills
            </p>
            <p className="text-2xl font-semibold text-status-warning tabular-nums">
              {result.missingSkills.length}
            </p>
            <p className="text-xs text-content-secondary">
              {result.tactical?.offense.projectedScoreAfterTop3
                ? `Closing top ${Math.min(3, result.missingSkills.length)} raises match to ${result.tactical.offense.projectedScoreAfterTop3}%.`
                : `${partiallyMetSkills.length} partially met · ${strictlyMissingSkills.length} not yet on resume.`}
            </p>
          </Card>

          <Card muted padding="sm" className="space-y-1.5">
            <p className="text-xs font-medium text-content-secondary">
              Evidence Strength
            </p>
            <p className="text-2xl font-semibold text-primary tabular-nums">
              {evidenceStrengthPct}%
            </p>
            <p className="text-xs text-content-secondary">
              {verifiedMatchCount > 0
                ? `${verifiedMatchCount} matched skills backed by interview scores.`
                : "Resume-only evidence — verify skills in a mock interview."}
            </p>
          </Card>
        </div>

        <ProgressBar
          label={`Overall requirement coverage (${result.matchedSkills.length} of ${totalRequirements} requirements met)`}
          value={result.score}
          tone={
            result.score >= 75
              ? "success"
              : result.score >= 50
                ? "primary"
                : "warning"
          }
        />
      </Card>

      {/* 2. Missing Skills & Prioritized Preparation Plan */}
      <SectionCard
        eyebrow="Gap Analysis"
        title={`Missing Skills & Priority Ranking (${result.skillGaps.length})`}
        description="Ranked by mention frequency in this job posting, occurrence across your saved jobs, and past interview evaluations."
        action={
          result.skillGaps.length > 0 ? (
            <Button variant="outline" size="sm" onClick={toggleAllResources}>
              {expandedSkills.size === result.skillGaps.length
                ? "Collapse study resources"
                : "Expand all study resources"}
            </Button>
          ) : undefined
        }
        empty={result.skillGaps.length === 0}
        emptyTitle="Zero missing requirements"
        emptyDescription="Your active resume and verified interview profile cover every requirement extracted from this role."
      >
        <ul className="space-y-3">
          {result.skillGaps.map((gap) => {
            const normSkill = gap.skill.toLowerCase().trim();
            const isOpen = expandedSkills.has(gap.skill);
            const resources = getResourcesForSkill(gap.skill);
            const isPartiallyMet = exposedSet.has(normSkill);
            const savedJobCount = Math.max(1, jobFrequencyMap[normSkill] ?? 1);

            return (
              <li key={gap.skill}>
                <Card padding="none" className="overflow-hidden">
                  <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <AlertTriangle
                          className="h-4 w-4 shrink-0 text-status-warning"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-semibold text-content-heading">
                          {gap.skill}
                        </span>
                        <Badge tone={priorityToneMap[gap.priority]} size="sm">
                          {gap.priority} priority
                        </Badge>
                        <Badge tone="primary" size="sm">
                          Appears in {savedJobCount} tracked{" "}
                          {savedJobCount === 1 ? "job" : "jobs"}
                        </Badge>
                        {isPartiallyMet && (
                          <Badge tone="warning" size="sm">
                            Partially met · Flagged in interview
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs leading-relaxed text-content-body">
                        <strong className="font-medium text-content-heading">
                          Evidence:{" "}
                        </strong>
                        {gap.evidence}
                      </p>

                      <p className="text-xs text-content-secondary">
                        <strong className="font-medium text-content-heading">
                          Recommended action:{" "}
                        </strong>
                        {isPartiallyMet
                          ? `Retake a 15-minute targeted interview on ${gap.skill} to convert weak evidence into Verified.`
                          : `Complete a targeted practice interview on ${gap.skill} and add concrete project proof to your resume.`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSkillResources(gap.skill)}
                        leftIcon={<BookOpen className="h-3.5 w-3.5" />}
                        rightIcon={
                          isOpen ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        }
                      >
                        Study resources
                      </Button>

                      {onPracticeSkill && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onPracticeSkill(gap.skill)}
                          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                        >
                          Practice this skill
                        </Button>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-border bg-muted/50 p-4 sm:px-5">
                      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-content-secondary">
                        Curated Documentation & Practice Tasks for {gap.skill}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {resources.map((res) => (
                          <a
                            key={res.url}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col justify-between rounded-input border border-border bg-surface p-3.5 transition-colors hover:border-primary"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase text-content-secondary">
                                  {RESOURCE_TYPE_ICON[res.type]}
                                  {res.type}
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-content-secondary group-hover:text-primary" />
                              </div>
                              <p className="text-xs font-semibold text-content-heading group-hover:text-primary">
                                {res.title}
                              </p>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px] text-content-secondary">
                              <span>{res.provider}</span>
                              <span>{res.durationOrLevel}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      {/* 3. Matched Skills & Evidence Source */}
      <SectionCard
        eyebrow="Credited Qualifications"
        title={`Matched Skills & Evidence Source (${result.matchedSkills.length})`}
        description="Every matched requirement shows whether it is verified by a mock interview rubric or extracted from your active resume."
        empty={result.matchedSkills.length === 0}
        emptyTitle="No matched skills yet"
        emptyDescription="Your active resume does not currently list the technical skills extracted from this job posting."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.matchedSkills.map((skill) => {
            const norm = skill.toLowerCase().trim();
            const isVerified = fortifiedSet.has(norm);
            return (
              <Card
                key={skill}
                padding="sm"
                className="flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isVerified ? (
                      <ShieldCheck className="h-4 w-4 shrink-0 text-status-success" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    )}
                    <span className="truncate text-sm font-semibold text-content-heading">
                      {skill}
                    </span>
                  </div>
                  <SkillBadge
                    skill={skill}
                    level={isVerified ? "VERIFIED" : "EXTRACTED"}
                    meta={isVerified ? "Verified" : "Resume"}
                  />
                </div>
                <p className="text-xs text-content-secondary">
                  {isVerified
                    ? "Evidence: Verified in a rubric-scored mock interview session."
                    : "Evidence: Extracted from your active resume — test in an interview to verify."}
                </p>
              </Card>
            );
          })}
        </div>
      </SectionCard>

      {/* 4. Requirement Checklist: Met / Partially Met / Missing */}
      <SectionCard
        eyebrow="Complete Audit"
        title="Requirement Checklist"
        description="Full breakdown of Met, Partially Met, and Missing role requirements."
      >
        <Tabs
          activeTab={checklistTab}
          onChange={setChecklistTab}
          items={[
            {
              id: "all",
              label: "All Requirements",
              count: totalRequirements,
              content: (
                <div className="space-y-2.5">
                  {result.matchedSkills.map((skill) => {
                    const isVerified = fortifiedSet.has(
                      skill.toLowerCase().trim(),
                    );
                    return (
                      <RequirementRow
                        key={`all-met-${skill}`}
                        skill={skill}
                        status={isVerified ? "MET" : "PRACTICED"}
                        evidence={
                          isVerified
                            ? "Met · Verified in mock interview evaluation"
                            : "Met · Claimed on your active resume"
                        }
                      />
                    );
                  })}
                  {partiallyMetSkills.map((skill) => (
                    <RequirementRow
                      key={`all-partial-${skill}`}
                      skill={skill}
                      status="WEAK"
                      priority="high"
                      evidence={
                        weakSkillsMap[skill.toLowerCase().trim()] ||
                        "Partially met · Listed on resume but flagged weak in prior interview"
                      }
                      action={
                        onPracticeSkill ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPracticeSkill(skill)}
                          >
                            Practice skill
                          </Button>
                        ) : undefined
                      }
                    />
                  ))}
                  {strictlyMissingSkills.map((skill) => {
                    const gapObj = result.skillGaps.find(
                      (g) => g.skill.toLowerCase() === skill.toLowerCase(),
                    );
                    return (
                      <RequirementRow
                        key={`all-miss-${skill}`}
                        skill={skill}
                        status="MISSING"
                        priority={gapObj?.priority ?? "medium"}
                        evidence={
                          gapObj?.evidence ??
                          "Missing · Required by job description, not found on resume"
                        }
                        action={
                          onPracticeSkill ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onPracticeSkill(skill)}
                            >
                              Practice skill
                            </Button>
                          ) : undefined
                        }
                      />
                    );
                  })}
                </div>
              ),
            },
            {
              id: "met",
              label: "Met",
              count: result.matchedSkills.length,
              content:
                result.matchedSkills.length === 0 ? (
                  <EmptyState
                    title="No requirements met yet"
                    description="None of the extracted skills for this role match your current resume."
                  />
                ) : (
                  <div className="space-y-2.5">
                    {result.matchedSkills.map((skill) => {
                      const isVerified = fortifiedSet.has(
                        skill.toLowerCase().trim(),
                      );
                      return (
                        <RequirementRow
                          key={`met-${skill}`}
                          skill={skill}
                          status={isVerified ? "MET" : "PRACTICED"}
                          evidence={
                            isVerified
                              ? "Verified in mock interview"
                              : "Extracted from active resume"
                          }
                        />
                      );
                    })}
                  </div>
                ),
            },
            {
              id: "partial",
              label: "Partially Met",
              count: partiallyMetSkills.length,
              content:
                partiallyMetSkills.length === 0 ? (
                  <EmptyState
                    title="No partially met skills"
                    description="No skills for this role are currently flagged weak from past interviews."
                  />
                ) : (
                  <div className="space-y-2.5">
                    {partiallyMetSkills.map((skill) => (
                      <RequirementRow
                        key={`partial-${skill}`}
                        skill={skill}
                        status="WEAK"
                        priority="high"
                        evidence={
                          weakSkillsMap[skill.toLowerCase().trim()] ||
                          "Flagged for review in a previous mock interview"
                        }
                        action={
                          onPracticeSkill ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onPracticeSkill(skill)}
                            >
                              Retake practice
                            </Button>
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                ),
            },
            {
              id: "missing",
              label: "Missing",
              count: strictlyMissingSkills.length,
              content:
                strictlyMissingSkills.length === 0 ? (
                  <EmptyState
                    title="No missing requirements"
                    description="All extracted requirements for this job are present on your profile."
                  />
                ) : (
                  <div className="space-y-2.5">
                    {strictlyMissingSkills.map((skill) => {
                      const gapObj = result.skillGaps.find(
                        (g) => g.skill.toLowerCase() === skill.toLowerCase(),
                      );
                      return (
                        <RequirementRow
                          key={`missing-${skill}`}
                          skill={skill}
                          status="MISSING"
                          priority={gapObj?.priority ?? "medium"}
                          evidence={
                            gapObj?.evidence ??
                            "Required by role, not present on active resume"
                          }
                          action={
                            onPracticeSkill ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPracticeSkill(skill)}
                              >
                                Practice skill
                              </Button>
                            ) : undefined
                          }
                        />
                      );
                    })}
                  </div>
                ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
};

export default MatchResult;
