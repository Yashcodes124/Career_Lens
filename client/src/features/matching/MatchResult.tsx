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
  FileText,
  Briefcase,
  MessageSquare,
  PlayCircle,
  ShieldCheck,
  GitBranch,
} from "lucide-react";
import type {
  GapPriority,
  MatchResult as MatchResultType,
  PrerequisiteReadinessAlert,
  SkillConfidence,
  SkillEvidenceAuditItem,
  SkillVerificationState,
  ClaimVerificationStatus,
} from "./types";
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
  hasVerifiedOrProjectEvidence = false,
): { label: string; tone: BadgeTone } => {
  if (score >= 80) {
    return hasVerifiedOrProjectEvidence
      ? { label: "Strong match", tone: "success" }
      : { label: "Resume match (Unverified)", tone: "primary" };
  }
  if (score >= 60) return { label: "Good match", tone: "primary" };
  if (score >= 40) return { label: "Partial match", tone: "warning" };
  return { label: "Needs preparation", tone: "danger" };
};

const CONFIDENCE_META: Record<
  SkillConfidence,
  { label: string; tone: BadgeTone }
> = {
  EXACT_MATCH: { label: "Exact match", tone: "success" },
  ALIAS_MATCH: { label: "Alias match", tone: "primary" },
  INFERRED_MATCH: { label: "Context inferred", tone: "primary" },
  PARTIAL_MATCH: { label: "Partial match", tone: "warning" },
  LOW_CONFIDENCE: { label: "Low confidence", tone: "warning" },
  MISSING: { label: "No match", tone: "neutral" },
};

const CLAIM_STATUS_META: Record<
  ClaimVerificationStatus,
  { label: string; tone: BadgeTone }
> = {
  VERIFIED_STRONG: { label: "Verified strong", tone: "success" },
  VERIFIED_WEAK: { label: "Verified weak", tone: "danger" },
  RESUME_CLAIMED: { label: "Resume claimed", tone: "primary" },
  CONTEXT_INFERRED: { label: "Context inferred", tone: "primary" },
  LOW_CONFIDENCE: { label: "Low confidence", tone: "warning" },
  MISSING: { label: "Missing", tone: "neutral" },
};

const VERIFICATION_META: Record<
  SkillVerificationState,
  { label: string; tone: BadgeTone }
> = {
  VERIFIED_STRONG: { label: "Verified strong", tone: "success" },
  UNVERIFIED: { label: "Unverified resume claim", tone: "primary" },
  WEAK: { label: "Weak in interview", tone: "warning" },
  MISSING: { label: "Missing", tone: "danger" },
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

  const auditMap = useMemo(() => {
    const map = new Map<string, SkillEvidenceAuditItem>();
    for (const item of result.skillAudit ?? []) {
      map.set(item.skill.toLowerCase().trim(), item);
    }
    return map;
  }, [result.skillAudit]);

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
  const defaultImpactPct =
    totalRequirements > 0 ? Math.round((1 / totalRequirements) * 100) : 0;

  const verifiedMatchCount = result.matchedSkills.filter((s) =>
    fortifiedSet.has(s.toLowerCase().trim()),
  ).length;

  const hasStrongOrProjectProof =
    verifiedMatchCount > 0 ||
    (result.skillAudit ?? []).some(
      (i) =>
        i.claimStatus === "VERIFIED_STRONG" || i.hasProjectOrExperienceEvidence,
    );
  const readiness = getReadinessLabel(result.score, hasStrongOrProjectProof);

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
              <Badge tone="primary">
                Each skill = +{defaultImpactPct}% match score
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

        {/* 4 Actionable Summary Metrics */}
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

        {/* Seniority-Aware Skill Alignment */}
        {result.seniorityAssessment && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-input border border-border bg-muted/40 p-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-semibold text-content-heading">
                Seniority-Aware Skill Alignment · Target:{" "}
                {result.seniorityAssessment.targetSeniority.replace("_", "/")}{" "}
                (Your profile:{" "}
                {result.seniorityAssessment.candidateSeniority.replace(
                  "_",
                  "/",
                )}
                )
              </p>
              <p className="text-content-body">
                {result.seniorityAssessment.summary}
              </p>
            </div>
            <Badge
              tone={
                result.seniorityAssessment.seniorityAligned
                  ? "success"
                  : "warning"
              }
              size="sm"
            >
              {result.seniorityAssessment.seniorityAligned
                ? "Seniority Aligned"
                : "Depth Gap"}
            </Badge>
          </div>
        )}

        {/* Skill Prerequisite Relationships (e.g., Kubernetes requires Docker/Linux/Networking) */}
        {result.prerequisiteAlerts && result.prerequisiteAlerts.length > 0 && (
          <div className="rounded-input border border-status-warning-border bg-status-warning-soft/40 p-3.5 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-status-warning">
              <GitBranch className="h-3.5 w-3.5 shrink-0" />
              <span>
                Foundational Prerequisite Relationships (
                {result.prerequisiteAlerts.length})
              </span>
            </div>
            <ul className="space-y-1 text-content-body">
              {result.prerequisiteAlerts.map((alert:PrerequisiteReadinessAlert) => (
                <li
                  key={alert.targetSkill}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span>{alert.rationale}</span>
                  {onPracticeSkill && alert.missingPrerequisites[0] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onPracticeSkill(alert.missingPrerequisites[0])
                      }
                    >
                      Practice {alert.missingPrerequisites[0]}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* 1B. Three Distinct Scores + 7-Factor Score Decomposition */}
      {result.scoreDecomposition && (
        <SectionCard
          eyebrow="Transparent Score Decomposition"
          title="Match vs. Readiness vs. Preparation Breakdown"
          description="TrueHire separates paper resume matching from live interview readiness and high-impact gap completion."
        >
          <div className="space-y-6">
            {/* 3 Distinct Questions: Match Score vs Readiness Score vs Preparation Score */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card muted padding="md" className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                    1. Match Score
                  </span>
                  <Badge
                    tone={
                      result.scoreDecomposition.headlineScores.matchScore
                        .score >= 70
                        ? "success"
                        : "primary"
                    }
                    size="sm"
                  >
                    {result.scoreDecomposition.headlineScores.matchScore.score}%
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-content-heading">
                  “
                  {result.scoreDecomposition.headlineScores.matchScore.question}
                  ”
                </p>
                <ProgressBar
                  value={
                    result.scoreDecomposition.headlineScores.matchScore.score
                  }
                  tone="primary"
                />
                <p className="text-xs text-content-secondary">
                  {result.scoreDecomposition.headlineScores.matchScore.summary}
                </p>
              </Card>

              <Card muted padding="md" className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                    2. Readiness Score
                  </span>
                  <Badge
                    tone={
                      result.scoreDecomposition.headlineScores.readinessScore
                        .score >= 70
                        ? "success"
                        : "warning"
                    }
                    size="sm"
                  >
                    {
                      result.scoreDecomposition.headlineScores.readinessScore
                        .score
                    }
                    %
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-content-heading">
                  “
                  {
                    result.scoreDecomposition.headlineScores.readinessScore
                      .question
                  }
                  ”
                </p>
                <ProgressBar
                  value={
                    result.scoreDecomposition.headlineScores.readinessScore
                      .score
                  }
                  tone={
                    result.scoreDecomposition.headlineScores.readinessScore
                      .score >= 70
                      ? "success"
                      : "warning"
                  }
                />
                <p className="text-xs text-content-secondary">
                  {
                    result.scoreDecomposition.headlineScores.readinessScore
                      .summary
                  }
                </p>
              </Card>

              <Card muted padding="md" className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                    3. Preparation Score
                  </span>
                  <Badge
                    tone={
                      result.scoreDecomposition.headlineScores.preparationScore
                        .score >= 70
                        ? "success"
                        : "primary"
                    }
                    size="sm"
                  >
                    {
                      result.scoreDecomposition.headlineScores.preparationScore
                        .score
                    }
                    %
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-content-heading">
                  “
                  {
                    result.scoreDecomposition.headlineScores.preparationScore
                      .question
                  }
                  ”
                </p>
                <ProgressBar
                  value={
                    result.scoreDecomposition.headlineScores.preparationScore
                      .score
                  }
                  tone="success"
                />
                <p className="text-xs text-content-secondary">
                  {
                    result.scoreDecomposition.headlineScores.preparationScore
                      .summary
                  }
                </p>
              </Card>
            </div>

            {/* 7-Factor Granular Decomposition Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card padding="sm" className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-content-heading">
                    Required-Skill Coverage
                  </span>
                  <span className="font-semibold text-primary tabular-nums">
                    {
                      result.scoreDecomposition.factors.requiredSkillCoverage
                        .score
                    }
                    %
                  </span>
                </div>
                <ProgressBar
                  value={
                    result.scoreDecomposition.factors.requiredSkillCoverage
                      .score
                  }
                  tone="primary"
                />
                <p className="text-[11px] text-content-secondary">
                  {
                    result.scoreDecomposition.factors.requiredSkillCoverage
                      .detail
                  }
                </p>
              </Card>

              <Card padding="sm" className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-content-heading">
                    Preferred-Skill Coverage
                  </span>
                  <span className="font-semibold text-primary tabular-nums">
                    {
                      result.scoreDecomposition.factors.preferredSkillCoverage
                        .score
                    }
                    %
                  </span>
                </div>
                <ProgressBar
                  value={
                    result.scoreDecomposition.factors.preferredSkillCoverage
                      .score
                  }
                  tone="primary"
                />
                <p className="text-[11px] text-content-secondary">
                  {
                    result.scoreDecomposition.factors.preferredSkillCoverage
                      .detail
                  }
                </p>
              </Card>

              <Card padding="sm" className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-content-heading">
                    Interview-Verified Coverage
                  </span>
                  <span className="font-semibold text-status-success tabular-nums">
                    {
                      result.scoreDecomposition.factors
                        .interviewVerifiedCoverage.score
                    }
                    %
                  </span>
                </div>
                <ProgressBar
                  value={
                    result.scoreDecomposition.factors.interviewVerifiedCoverage
                      .score
                  }
                  tone="success"
                />
                <p className="text-[11px] text-content-secondary">
                  {
                    result.scoreDecomposition.factors.interviewVerifiedCoverage
                      .detail
                  }
                </p>
              </Card>

              <Card padding="sm" className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-content-heading">
                    Resume-Evidence Quality
                  </span>
                  <span className="font-semibold text-primary tabular-nums">
                    {
                      result.scoreDecomposition.factors.resumeEvidenceQuality
                        .score
                    }
                    %
                  </span>
                </div>
                <ProgressBar
                  value={
                    result.scoreDecomposition.factors.resumeEvidenceQuality
                      .score
                  }
                  tone="primary"
                />
                <p className="text-[11px] text-content-secondary">
                  {
                    result.scoreDecomposition.factors.resumeEvidenceQuality
                      .detail
                  }
                </p>
              </Card>

              <Card padding="sm" className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-content-heading">
                    Experience-Level Alignment
                  </span>
                  <span className="font-semibold text-primary tabular-nums">
                    {
                      result.scoreDecomposition.factors.experienceAlignment
                        .score
                    }
                    %
                  </span>
                </div>
                <ProgressBar
                  value={
                    result.scoreDecomposition.factors.experienceAlignment.score
                  }
                  tone="success"
                />
                <p className="text-[11px] text-content-secondary">
                  {result.scoreDecomposition.factors.experienceAlignment.detail}
                </p>
              </Card>

              <Card padding="sm" className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-content-heading">
                    Critical-Gap Penalty
                  </span>
                  <span className="font-semibold text-status-danger tabular-nums">
                    -
                    {
                      result.scoreDecomposition.factors.criticalGapPenalty
                        .penaltyPct
                    }
                    %
                  </span>
                </div>
                <ProgressBar
                  value={Math.max(
                    0,
                    100 -
                      result.scoreDecomposition.factors.criticalGapPenalty
                        .penaltyPct,
                  )}
                  tone="warning"
                />
                <p className="text-[11px] text-content-secondary">
                  {result.scoreDecomposition.factors.criticalGapPenalty.detail}
                </p>
              </Card>

              <Card padding="sm" className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-content-heading">
                    Job-Description Signal Confidence
                  </span>
                  <Badge
                    tone={
                      result.scoreDecomposition.factors.jobDescriptionConfidence
                        .level === "HIGH"
                        ? "success"
                        : result.scoreDecomposition.factors
                              .jobDescriptionConfidence.level === "MEDIUM"
                          ? "primary"
                          : "warning"
                    }
                    size="sm"
                  >
                    {
                      result.scoreDecomposition.factors.jobDescriptionConfidence
                        .level
                    }{" "}
                    (
                    {
                      result.scoreDecomposition.factors.jobDescriptionConfidence
                        .score
                    }
                    %)
                  </Badge>
                </div>
                <ProgressBar
                  value={
                    result.scoreDecomposition.factors.jobDescriptionConfidence
                      .score
                  }
                  tone="primary"
                />
                <p className="text-[11px] text-content-secondary">
                  {
                    result.scoreDecomposition.factors.jobDescriptionConfidence
                      .detail
                  }
                </p>
              </Card>
            </div>
          </div>
        </SectionCard>
      )}

      {/* 1C. Claim Verification Engine (6-Status Ledger + Failed Claim Alerts) */}
      {result.skillAudit && result.skillAudit.length > 0 && (
        <SectionCard
          eyebrow="Claim Verification Engine"
          title="Resume Claim vs. Interview Proof Audit"
          description="TrueHire does not treat resume keywords as proof of expertise. Every skill is classified by verification evidence, and weak interview skills are withheld from match strengths."
        >
          <div className="space-y-4">
            {/* 6-Status Summary Strip */}
            <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {(
                [
                  {
                    status: "VERIFIED_STRONG",
                    title: "Verified strong",
                    desc: "Proven in interview",
                  },
                  {
                    status: "VERIFIED_WEAK",
                    title: "Verified weak",
                    desc: "Interview exposed gap",
                  },
                  {
                    status: "RESUME_CLAIMED",
                    title: "Resume claimed",
                    desc: "Listed, unvalidated",
                  },
                  {
                    status: "CONTEXT_INFERRED",
                    title: "Context inferred",
                    desc: "In projects only",
                  },
                  {
                    status: "LOW_CONFIDENCE",
                    title: "Low confidence",
                    desc: "Bare/alias keyword",
                  },
                  {
                    status: "MISSING",
                    title: "Missing",
                    desc: "Not found anywhere",
                  },
                ] as const
              ).map((bucket) => {
                const count = (result.skillAudit ?? []).filter(
                  (i) => i.claimStatus === bucket.status,
                ).length;
                const meta = CLAIM_STATUS_META[bucket.status];
                return (
                  <Card
                    key={bucket.status}
                    muted
                    padding="sm"
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <Badge tone={meta.tone} size="sm">
                        {bucket.title}
                      </Badge>
                      <span className="text-base font-semibold text-content-heading tabular-nums">
                        {count}
                      </span>
                    </div>
                    <p className="text-[11px] text-content-secondary">
                      {bucket.desc}
                    </p>
                  </Card>
                );
              })}
            </div>

            {/* Guardrail 4: Flag repeated claims that fail interview validation */}
            {result.skillAudit.some((i) => i.repeatedFailedClaim) && (
              <Card
                padding="sm"
                className="border-status-danger-border bg-status-danger-soft/50 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-status-danger" />
                  <p className="text-xs font-semibold text-status-danger">
                    Failed Claim Validation Alert — Resume Claims Withheld from
                    Match Score
                  </p>
                </div>
                <ul className="space-y-1 text-xs text-content-body">
                  {result.skillAudit
                    .filter((i) => i.repeatedFailedClaim)
                    .map((item) => (
                      <li
                        key={`failed-claim-${item.skill}`}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <span>
                          <strong className="font-semibold text-content-heading">
                            {item.skill}:
                          </strong>{" "}
                          {item.failedClaimWarning}{" "}
                          {item.interviewEvidence.citation
                            ? `(${item.interviewEvidence.citation})`
                            : ""}
                        </span>
                        {onPracticeSkill && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPracticeSkill(item.skill)}
                          >
                            Re-verify {item.skill}
                          </Button>
                        )}
                      </li>
                    ))}
                </ul>
              </Card>
            )}
          </div>
        </SectionCard>
      )}

      {/* 2. Matched Skills — Evidence-Linked Verification Cards */}
      <SectionCard
        eyebrow="Credited Qualifications"
        title={`Matched Skills & Evidence Trail (${result.matchedSkills.length})`}
        description="Every credited skill shows its resume evidence, job requirement frequency, interview verification citation, match confidence, and exact score impact."
        empty={result.matchedSkills.length === 0}
        emptyTitle="No matched skills yet"
        emptyDescription="Your active resume does not currently list the technical skills extracted from this job posting."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {result.matchedSkills.map((skill) => {
            const norm = skill.toLowerCase().trim();
            const audit = auditMap.get(norm);
            const isVerified =
              audit?.verificationState === "VERIFIED_STRONG" ||
              fortifiedSet.has(norm);
            const impactPct = audit?.impactPct ?? defaultImpactPct;
            const confidenceMeta =
              CONFIDENCE_META[audit?.confidence ?? "EXACT_MATCH"];
            const claimMeta = audit?.claimStatus
              ? CLAIM_STATUS_META[audit.claimStatus]
              : VERIFICATION_META[
                  isVerified ? "VERIFIED_STRONG" : "UNVERIFIED"
                ];

            return (
              <Card
                key={skill}
                padding="md"
                className="flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {isVerified ? (
                        <ShieldCheck className="h-4 w-4 shrink-0 text-status-success" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      <span className="text-sm font-semibold text-content-heading">
                        {skill} — {claimMeta.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={confidenceMeta.tone} size="sm">
                        {confidenceMeta.label}
                      </Badge>
                      <Badge tone="success" size="sm">
                        Impact: +{impactPct}% match score
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 rounded-input border border-border bg-muted/40 p-3 text-xs">
                    <p className="text-content-body">
                      <strong className="inline-flex items-center gap-1 font-semibold text-content-heading">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        Interview evidence:{" "}
                      </strong>
                      {audit?.interviewEvidence.citation ||
                        (isVerified
                          ? "Verified strong in rubric-scored mock interview evaluation."
                          : "Unverified claim — not yet tested in a mock interview.")}
                    </p>

                    <p className="text-content-body">
                      <strong className="inline-flex items-center gap-1 font-semibold text-content-heading">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        Resume evidence
                        {audit?.resumeEvidence.section
                          ? ` (${audit.resumeEvidence.section})`
                          : ""}
                        :{" "}
                      </strong>
                      {audit?.resumeEvidence.snippet
                        ? `"${audit.resumeEvidence.snippet}"`
                        : `Extracted from active resume as "${skill}".`}
                    </p>

                    <p className="text-content-secondary">
                      <strong className="inline-flex items-center gap-1 font-semibold text-content-heading">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                        Job requirement:{" "}
                      </strong>
                      {audit?.jobEvidence.summary ??
                        "Listed in role requirements"}
                      {audit?.jobEvidence.snippet
                        ? ` — "${audit.jobEvidence.snippet}"`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
                  <span className="text-xs text-content-secondary">
                    {audit?.recommendedAction ??
                      (isVerified
                        ? "Verified strong — highlight this proof point in your application."
                        : "Verify this claim in a targeted mock interview.")}
                  </span>
                  {!isVerified && onPracticeSkill && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPracticeSkill(skill)}
                      rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    >
                      Verify skill
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </SectionCard>

      {/* 3. Missing & Weak Skills — Evidence-Linked Gap Cards */}
      <SectionCard
        eyebrow="Gap Analysis"
        title={`Missing & Weak Skills — Evidence & Impact (${result.skillGaps.length})`}
        description="Ranked by mention frequency in this job posting, interview evidence, and exact score impact."
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
            const audit = auditMap.get(normSkill);
            const isOpen = expandedSkills.has(gap.skill);
            const resources = getResourcesForSkill(gap.skill);
            const isPartiallyMet =
              audit?.verificationState === "WEAK" || exposedSet.has(normSkill);
            const savedJobCount = Math.max(1, jobFrequencyMap[normSkill] ?? 1);
            const impactPct = audit?.impactPct ?? defaultImpactPct;
            const confidenceMeta =
              CONFIDENCE_META[
                audit?.confidence ??
                  (isPartiallyMet ? "PARTIAL_MATCH" : "MISSING")
              ];

            return (
              <li key={gap.skill}>
                <Card padding="none" className="overflow-hidden">
                  <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <AlertTriangle
                          className="h-4 w-4 shrink-0 text-status-warning"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-semibold text-content-heading">
                          {gap.skill} —{" "}
                          {isPartiallyMet ? "Weak in interview" : "Missing"}
                        </span>
                        <Badge tone={priorityToneMap[gap.priority]} size="sm">
                          {gap.priority} priority
                        </Badge>
                        <Badge tone={confidenceMeta.tone} size="sm">
                          {confidenceMeta.label}
                        </Badge>
                        <Badge tone="warning" size="sm">
                          Impact: +{impactPct}% match score
                        </Badge>
                        <Badge tone="primary" size="sm">
                          In {savedJobCount} tracked{" "}
                          {savedJobCount === 1 ? "job" : "jobs"}
                        </Badge>
                      </div>

                      <div className="space-y-1 rounded-input border border-border bg-muted/40 p-3 text-xs">
                        <p className="text-content-body">
                          <strong className="font-semibold text-content-heading">
                            Job requirement:{" "}
                          </strong>
                          {audit?.jobEvidence.summary ?? gap.evidence}
                          {audit?.jobEvidence.snippet
                            ? ` — "${audit.jobEvidence.snippet}"`
                            : ""}
                        </p>

                        <p className="text-content-body">
                          <strong className="font-semibold text-content-heading">
                            Resume evidence:{" "}
                          </strong>
                          {audit?.resumeEvidence.found &&
                          audit.resumeEvidence.snippet
                            ? `Found in ${audit.resumeEvidence.section ?? "Resume"}: "${audit.resumeEvidence.snippet}"`
                            : "Not found on active resume."}
                        </p>

                        {isPartiallyMet && (
                          <p className="text-status-warning">
                            <strong className="font-semibold">
                              Interview evidence:{" "}
                            </strong>
                            {audit?.interviewEvidence.citation ||
                              weakSkillsMap[normSkill] ||
                              "Flagged weak in a prior mock interview — practice to reclaim credit."}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-content-secondary">
                        <strong className="font-medium text-content-heading">
                          Recommended action:{" "}
                        </strong>
                        {audit?.recommendedAction ??
                          (isPartiallyMet
                            ? `Retake a 15-minute targeted interview on ${gap.skill} to reclaim +${impactPct}% match score.`
                            : `Complete a deployment project + targeted interview on ${gap.skill} (+${impactPct}% match score).`)}
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

      {/* 4. Requirement Checklist: Met / Partially Met / Missing */}
      <SectionCard
        eyebrow="Complete Audit"
        title="Requirement Checklist"
        description="Full breakdown of Met, Partially Met, and Missing role requirements with exact evidence."
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
                    const norm = skill.toLowerCase().trim();
                    const audit = auditMap.get(norm);
                    const isVerified = fortifiedSet.has(norm);
                    const impact = audit?.impactPct ?? defaultImpactPct;
                    return (
                      <RequirementRow
                        key={`all-met-${skill}`}
                        skill={skill}
                        status={isVerified ? "MET" : "PRACTICED"}
                        evidence={
                          audit
                            ? `${
                                isVerified
                                  ? audit.interviewEvidence.summary
                                  : audit.resumeEvidence.snippet
                                    ? `Resume (${audit.resumeEvidence.section ?? "Skills"}): "${audit.resumeEvidence.snippet}"`
                                    : "Claimed on active resume"
                              } · ${audit.jobEvidence.summary} · Impact: +${impact}%`
                            : isVerified
                              ? `Met · Verified in mock interview evaluation · Impact: +${impact}%`
                              : `Met · Claimed on your active resume · Impact: +${impact}%`
                        }
                      />
                    );
                  })}
                  {partiallyMetSkills.map((skill) => {
                    const norm = skill.toLowerCase().trim();
                    const audit = auditMap.get(norm);
                    const impact = audit?.impactPct ?? defaultImpactPct;
                    return (
                      <RequirementRow
                        key={`all-partial-${skill}`}
                        skill={skill}
                        status="WEAK"
                        priority="high"
                        evidence={`${
                          audit?.interviewEvidence.citation ||
                          weakSkillsMap[norm] ||
                          "Partially met · Listed on resume but flagged weak in prior interview"
                        } · ${audit?.jobEvidence.summary ?? ""} · Impact: +${impact}%`}
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
                  {strictlyMissingSkills.map((skill) => {
                    const norm = skill.toLowerCase().trim();
                    const audit = auditMap.get(norm);
                    const gapObj = result.skillGaps.find(
                      (g) => g.skill.toLowerCase() === norm,
                    );
                    const impact = audit?.impactPct ?? defaultImpactPct;
                    return (
                      <RequirementRow
                        key={`all-miss-${skill}`}
                        skill={skill}
                        status="MISSING"
                        priority={gapObj?.priority ?? "medium"}
                        evidence={`${
                          audit?.jobEvidence.summary ??
                          gapObj?.evidence ??
                          "Missing · Required by job description"
                        } · Impact: +${impact}%`}
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
                      const norm = skill.toLowerCase().trim();
                      const audit = auditMap.get(norm);
                      const isVerified = fortifiedSet.has(norm);
                      const impact = audit?.impactPct ?? defaultImpactPct;
                      return (
                        <RequirementRow
                          key={`met-${skill}`}
                          skill={skill}
                          status={isVerified ? "MET" : "PRACTICED"}
                          evidence={
                            audit
                              ? `${
                                  isVerified
                                    ? audit.interviewEvidence.summary
                                    : (audit.resumeEvidence.snippet ??
                                      "Extracted from active resume")
                                } · Impact: +${impact}%`
                              : isVerified
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
                    {partiallyMetSkills.map((skill) => {
                      const norm = skill.toLowerCase().trim();
                      const audit = auditMap.get(norm);
                      return (
                        <RequirementRow
                          key={`partial-${skill}`}
                          skill={skill}
                          status="WEAK"
                          priority="high"
                          evidence={
                            audit?.interviewEvidence.citation ||
                            weakSkillsMap[norm] ||
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
                      );
                    })}
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
                      const norm = skill.toLowerCase().trim();
                      const audit = auditMap.get(norm);
                      const gapObj = result.skillGaps.find(
                        (g) => g.skill.toLowerCase() === norm,
                      );
                      return (
                        <RequirementRow
                          key={`missing-${skill}`}
                          skill={skill}
                          status="MISSING"
                          priority={gapObj?.priority ?? "medium"}
                          evidence={
                            audit?.jobEvidence.summary ??
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
