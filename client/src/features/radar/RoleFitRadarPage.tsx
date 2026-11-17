import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  Compass,
  Filter,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { apiClient } from "../../lib/api-client";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ScoreRing,
  SectionCard,
  Skeleton,
  Tabs,
} from "../../components/ui";

export interface RadarJobOpportunity {
  jobId: string;
  title: string;
  company: string;
  location: string | null;
  source: string;
  url: string | null;
  salaryRange: string | null;
  lastSyncedAt: string;
  applicationStatus: string | null;
  isSaved: boolean;
  resumeOnlyScore: number;
  verifiedScore: number;
  evidenceDeltaPct: number;
  requiredCount: number;
  matchedCount: number;
  verifiedMatchedCount: number;
  unvalidatedMatchedCount: number;
  missingCount: number;
  matchedSkills: string[];
  verifiedSkillsUsed: string[];
  unvalidatedSkillsUsed: string[];
  weakSkillsPenalized: string[];
  missingSkills: string[];
  topUnlockSkill: string | null;
  singleSkillGainPct: number;
  projectedScoreWithOneSkill: number;
  strategicReason: string;
  recommendedAction: string;
}

export interface RoleFitRadarResponse {
  hasResume: boolean;
  resume: {
    id: string;
    title: string;
    fileName: string | null;
    skillsCount: number;
    experienceYrs: number;
  } | null;
  summary: {
    totalActiveJobsEvaluated: number;
    bestFitCount: number;
    oneSkillBreakoutCount: number;
    evidenceShiftedCount: number;
    needsValidationCount: number;
    deprioritizedCount: number;
  };
  buckets: {
    topBestFit: RadarJobOpportunity[];
    oneSkillBreakouts: RadarJobOpportunity[];
    evidenceShifted: RadarJobOpportunity[];
    needsValidation: RadarJobOpportunity[];
    deprioritized: RadarJobOpportunity[];
  };
}

type RadarBucketKey =
  | "topBestFit"
  | "oneSkillBreakouts"
  | "evidenceShifted"
  | "needsValidation"
  | "deprioritized";

const BUCKET_META: Record<
  RadarBucketKey,
  {
    title: string;
    eyebrow: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
  }
> = {
  topBestFit: {
    eyebrow: "Highest Immediate Readiness",
    title: "Top 10 Best-Fit Active Roles",
    description:
      "Active opportunities ranked by evidence-adjusted requirement coverage across your verified and resume skills.",
    emptyTitle: "No strong-fit roles (>= 50% coverage) detected yet",
    emptyDescription:
      "Sync active job boards on Explore Jobs or add verified skills to your profile.",
  },
  oneSkillBreakouts: {
    eyebrow: "Highest Leverage Targets",
    title: "Roles Where One Skill Addition Creates a Major Improvement",
    description:
      "Opportunities where closing a single missing or weak skill unlocks +10% or more match coverage or crosses the 70% interview-ready bar.",
    emptyTitle: "No single-skill breakout roles found",
    emptyDescription:
      "Your current roles either already exceed 95% match or require multiple foundational skills.",
  },
  evidenceShifted: {
    eyebrow: "Closed-Loop Impact",
    title: "Roles Where Interview Evidence Changed the Result",
    description:
      "Roles whose score moved up from interview-verified strengths or moved down when mock interviews exposed weak resume claims.",
    emptyTitle: "No roles shifted by interview evidence yet",
    emptyDescription:
      "Complete a mock interview to verify resume claims—your radar will immediately highlight roles boosted or adjusted by proof.",
  },
  needsValidation: {
    eyebrow: "Defense Audit · Paper Match vs. Proof",
    title: "Strong on Paper, Needs Interview Validation",
    description:
      "Roles with >= 65% keyword coverage where most matched skills rely on unverified resume claims rather than interview proof.",
    emptyTitle: "All strong-fit roles have verified interview backing",
    emptyDescription:
      "Great work—your top matched roles are supported by verified interview evidence.",
  },
  deprioritized: {
    eyebrow: "Focus Protection",
    title: "Poor-Fit Roles to Deprioritize",
    description:
      "Roles below 40% coverage that remain below 50% even after adding a top skill—deprioritize these to focus on high-ROI roles.",
    emptyTitle: "No low-fit roles flagged for deprioritization",
    emptyDescription:
      "Active listings align reasonably well with your current engineering profile.",
  },
};

export const RoleFitRadarPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<RoleFitRadarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] =
    useState<RadarBucketKey>("topBestFit");

  const loadRadar = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<{
        success: boolean;
        data: RoleFitRadarResponse;
      }>("/radar");
      setData(res.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not compute Role-Fit Radar across active jobs.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRadar();
  }, []);

  const currentItems = useMemo(
    () => (data ? data.buckets[activeBucket] : []),
    [data, activeBucket],
  );

  const meta = BUCKET_META[activeBucket];
  const activeResumeId = data?.resume?.id;

  const renderOpportunityCard = (item: RadarJobOpportunity, index: number) => {
    const scoreTone =
      item.verifiedScore >= 75
        ? "success"
        : item.verifiedScore >= 50
          ? "primary"
          : "warning";

    return (
      <Card key={item.jobId} padding="md" className="space-y-4">
        {/* Header Row */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {activeBucket === "topBestFit" && (
                <Badge tone="primary" size="sm">
                  #{index + 1} Best Fit
                </Badge>
              )}
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-content-heading">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                {item.company}
              </span>
              <Badge tone="neutral" size="sm">
                Source: {item.source}
              </Badge>
              {item.applicationStatus && (
                <Badge tone="success" size="sm">
                  {item.applicationStatus}
                </Badge>
              )}
              {item.evidenceDeltaPct > 0 && (
                <Badge tone="success" size="sm">
                  +{item.evidenceDeltaPct}% from interview proof
                </Badge>
              )}
              {item.evidenceDeltaPct < 0 && (
                <Badge tone="danger" size="sm">
                  {item.evidenceDeltaPct}% from exposed gap
                </Badge>
              )}
            </div>

            <h3 className="text-base font-semibold text-content-heading">
              {item.title}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-content-secondary">
              {item.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.location}
                </span>
              )}
              {item.salaryRange && (
                <span className="font-medium text-content-body tabular-nums">
                  {item.salaryRange}
                </span>
              )}
              <span className="tabular-nums">
                Meets {item.matchedCount} of {item.requiredCount} requirements
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {item.evidenceDeltaPct !== 0 && (
              <div className="text-right text-xs tabular-nums">
                <p className="text-content-secondary">Resume baseline</p>
                <p className="font-semibold text-content-heading">
                  {item.resumeOnlyScore}% → {item.verifiedScore}%
                </p>
              </div>
            )}
            <ScoreRing score={item.verifiedScore} size={64} />
          </div>
        </div>

        {/* Strategic Insight Strip */}
        <div className="rounded-input border border-border bg-muted/50 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
          <p className="text-content-body">
            <strong className="font-semibold text-content-heading">
              Radar Signal:{" "}
            </strong>
            {item.strategicReason}
          </p>
          {item.topUnlockSkill && item.singleSkillGainPct > 0 && (
            <Badge tone="primary" size="sm">
              +1 skill ({item.topUnlockSkill}) →{" "}
              {item.projectedScoreWithOneSkill}% (+{item.singleSkillGainPct}%)
            </Badge>
          )}
        </div>

        {/* Skill Breakdown Pills */}
        <div className="space-y-2 border-t border-border pt-3">
          {item.verifiedSkillsUsed.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-status-success">
                Verified ({item.verifiedSkillsUsed.length}):
              </span>
              {item.verifiedSkillsUsed.slice(0, 5).map((sk) => (
                <Badge key={`ver-${sk}`} tone="success" size="sm">
                  {sk}
                </Badge>
              ))}
            </div>
          )}

          {item.unvalidatedSkillsUsed.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-primary">
                Unvalidated resume claims ({item.unvalidatedSkillsUsed.length}):
              </span>
              {item.unvalidatedSkillsUsed.slice(0, 5).map((sk) => (
                <Badge key={`unv-${sk}`} tone="primary" size="sm">
                  {sk}
                </Badge>
              ))}
            </div>
          )}

          {item.weakSkillsPenalized.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-status-danger">
                Exposed weak ({item.weakSkillsPenalized.length}):
              </span>
              {item.weakSkillsPenalized.map((sk) => (
                <Badge key={`weak-${sk}`} tone="danger" size="sm">
                  {sk}
                </Badge>
              ))}
            </div>
          )}

          {item.missingSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-status-warning">
                Missing ({item.missingSkills.length}):
              </span>
              {item.missingSkills.slice(0, 5).map((sk) => (
                <Badge key={`miss-${sk}`} tone="warning" size="sm">
                  {sk}
                </Badge>
              ))}
              {item.missingSkills.length > 5 && (
                <Badge tone="neutral" size="sm">
                  +{item.missingSkills.length - 5} more
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(
                  `/matches/${item.jobId}${
                    activeResumeId ? `?resumeId=${activeResumeId}` : ""
                  }`,
                )
              }
              rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
            >
              Inspect evidence match
            </Button>

            {item.topUnlockSkill && activeBucket !== "deprioritized" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/skill-gaps/${item.jobId}?focusSkill=${encodeURIComponent(
                      item.topUnlockSkill!,
                    )}${activeResumeId ? `&resumeId=${activeResumeId}` : ""}`,
                  )
                }
              >
                Close {item.topUnlockSkill} gap (+{item.singleSkillGainPct}%)
              </Button>
            )}

            {activeBucket === "needsValidation" &&
              item.unvalidatedSkillsUsed[0] && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/skill-gaps/${item.jobId}?focusSkill=${encodeURIComponent(
                        item.unvalidatedSkillsUsed[0],
                      )}${activeResumeId ? `&resumeId=${activeResumeId}` : ""}`,
                    )
                  }
                >
                  Validate {item.unvalidatedSkillsUsed[0]} in interview
                </Button>
              )}
          </div>

          <Badge tone={scoreTone} size="sm">
            {item.recommendedAction}
          </Badge>
        </div>
      </Card>
    );
  };

  return (
    <ContentContainer size="xl" className="space-y-6">
      <PageHeader
        eyebrow="Strategic Opportunity Intelligence"
        title="Role-Fit Radar"
        description="Stop checking roles one by one. TrueHire scans all active listings against your verified skill profile and resume to surface your highest-leverage opportunities."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => navigate("/jobs")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Explore all jobs
          </Button>
        }
        secondaryActions={
          <Button
            variant="outline"
            onClick={() => void loadRadar()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Recalculate radar
          </Button>
        }
      />

      {error && (
        <ErrorState
          title="Could not load Role-Fit Radar"
          message={error}
          onRetry={() => void loadRadar()}
        />
      )}

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !data?.hasResume ? (
        <EmptyState
          title="Upload a resume to activate Role-Fit Radar"
          description="TrueHire evaluates every active job against your extracted resume skills and interview evidence to rank your strongest opportunities."
          icon={<Compass className="h-5 w-5" />}
          action={
            <Button variant="primary" onClick={() => navigate("/resume")}>
              Upload resume
            </Button>
          }
        />
      ) : (
        <>
          {/* 5 Strategic Quadrant Summary Cards */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                {
                  key: "topBestFit" as RadarBucketKey,
                  label: "Top Best-Fit Roles",
                  count: data.summary.bestFitCount,
                  sub: `Out of ${data.summary.totalActiveJobsEvaluated} active roles`,
                  tone: "text-status-success",
                  icon: <Award className="h-4 w-4 text-status-success" />,
                },
                {
                  key: "oneSkillBreakouts" as RadarBucketKey,
                  label: "+1 Skill Breakouts",
                  count: data.summary.oneSkillBreakoutCount,
                  sub: "Major gain from 1 skill",
                  tone: "text-primary",
                  icon: <TrendingUp className="h-4 w-4 text-primary" />,
                },
                {
                  key: "evidenceShifted" as RadarBucketKey,
                  label: "Evidence-Shifted",
                  count: data.summary.evidenceShiftedCount,
                  sub: "Changed by interview proof",
                  tone: "text-primary",
                  icon: <Sparkles className="h-4 w-4 text-primary" />,
                },
                {
                  key: "needsValidation" as RadarBucketKey,
                  label: "Needs Validation",
                  count: data.summary.needsValidationCount,
                  sub: "Strong paper, 0 proof",
                  tone: "text-status-warning",
                  icon: <ShieldAlert className="h-4 w-4 text-status-warning" />,
                },
                {
                  key: "deprioritized" as RadarBucketKey,
                  label: "Deprioritize",
                  count: data.summary.deprioritizedCount,
                  sub: "Poor fit (<40% match)",
                  tone: "text-content-secondary",
                  icon: <XCircle className="h-4 w-4 text-content-secondary" />,
                },
              ] as const
            ).map((card) => {
              const selected = activeBucket === card.key;
              return (
                <Card
                  key={card.key}
                  padding="sm"
                  interactive
                  onClick={() => setActiveBucket(card.key)}
                  className={`cursor-pointer space-y-1.5 ${
                    selected
                      ? "border-primary ring-1 ring-primary bg-primary-soft/20"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-content-secondary">
                      {card.label}
                    </span>
                    {card.icon}
                  </div>
                  <p
                    className={`text-2xl font-semibold tabular-nums ${card.tone}`}
                  >
                    {card.count}
                  </p>
                  <p className="text-[11px] text-content-secondary">
                    {card.sub}
                  </p>
                </Card>
              );
            })}
          </section>

          {/* Bucket Filter Tabs */}
          <Tabs
            activeTab={activeBucket}
            onChange={(id) => setActiveBucket(id as RadarBucketKey)}
            items={[
              {
                id: "topBestFit",
                label: "Top 10 Best-Fit",
                count: data.summary.bestFitCount,
              },
              {
                id: "oneSkillBreakouts",
                label: "+1 Skill Major Gain",
                count: data.summary.oneSkillBreakoutCount,
              },
              {
                id: "evidenceShifted",
                label: "Evidence-Changed",
                count: data.summary.evidenceShiftedCount,
              },
              {
                id: "needsValidation",
                label: "Needs Validation",
                count: data.summary.needsValidationCount,
              },
              {
                id: "deprioritized",
                label: "Deprioritized",
                count: data.summary.deprioritizedCount,
              },
            ]}
          />

          {/* Selected Radar Bucket Feed */}
          <SectionCard
            eyebrow={meta.eyebrow}
            title={meta.title}
            description={meta.description}
            action={
              data.resume && (
                <Badge tone="neutral" size="sm">
                  Baseline: {data.resume.fileName || data.resume.title} (
                  {data.resume.skillsCount} skills)
                </Badge>
              )
            }
          >
            {currentItems.length === 0 ? (
              <EmptyState
                title={meta.emptyTitle}
                description={meta.emptyDescription}
                icon={<Filter className="h-5 w-5" />}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/jobs")}
                  >
                    Browse verified jobs
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {currentItems.map((item, idx) =>
                  renderOpportunityCard(item, idx),
                )}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </ContentContainer>
  );
};

export default RoleFitRadarPage;
