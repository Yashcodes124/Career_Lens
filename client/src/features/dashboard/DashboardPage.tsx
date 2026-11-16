import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  Target,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { ReadinessPanel } from "../readiness/ReadinessPanel";
import { useReadiness } from "../readiness/useReadiness";
import type { ReadinessSkill } from "../readiness/readinessApi";
import { useResumes } from "../resume/useResumes";
import { useApplications } from "../tracker/useApplications";
import type { Application } from "../tracker/types";
import { fetchJobs } from "../jobs/jobsApi";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  JobCard,
  RequirementRow,
  SectionCard,
  Skeleton,
} from "../../components/ui";

interface JobSummary {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  source?: string | null;
  skills?: string[];
  externalUrl?: string | null;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    data: resumes,
    isLoading: resumesLoading,
    isError: resumesError,
    refetch: refetchResumes,
  } = useResumes();
  const {
    data: applications,
    isLoading: appsLoading,
    isError: appsError,
    refetch: refetchApps,
  } = useApplications();
  const { data: readiness, isLoading: readinessLoading } = useReadiness();

  // Fetch verified jobs so Recommended Jobs always has real roles even before tracking
  const { data: publicJobs } = useQuery<JobSummary[]>({
    queryKey: ["dashboard-recommended-jobs"],
    queryFn: async () => {
      const list = await fetchJobs();
      return list.slice(0, 4);
    },
    staleTime: 60_000,
  });

  const latestResume = resumes?.[0];
  const firstName = user?.name?.split(" ")[0];

  // Calculate metrics with concrete values and explanations
  const metrics = useMemo(() => {
    const verified =
      readiness?.skills.filter((s: ReadinessSkill) => s.status === "STRONG")
        .length ?? 0;
    const needsPractice =
      readiness?.skills.filter((s: ReadinessSkill) => s.status === "WEAK")
        .length ?? 0;
    const activePipeline = (applications ?? []).filter(
      (a: Application) => a.status !== "REJECTED",
    ).length;
    const extractedSkills = latestResume?.skills.length ?? 0;

    const totalSkills = verified + needsPractice + extractedSkills;
    const readinessScore =
      readiness?.defenseSummary?.defensibilityPct ??
      (totalSkills > 0
        ? Math.round(
            ((verified * 1.0 + extractedSkills * 0.5) / totalSkills) * 100,
          )
        : 0);

    return {
      readinessScore,
      verified,
      needsPractice,
      activePipeline,
      extractedSkills,
    };
  }, [readiness, applications, latestResume]);
  const skillProfileBuckets = useMemo(() => {
    const verifiedStrengths = (readiness?.skills ?? []).filter(
      (s: ReadinessSkill) => s.status === "STRONG",
    );
    const interviewWeaknesses = (readiness?.skills ?? []).filter(
      (s: ReadinessSkill) => s.status === "WEAK",
    );
    const evaluatedSet = new Set(
      (readiness?.skills ?? []).map((s: ReadinessSkill) =>
        s.skill.toLowerCase().trim(),
      ),
    );
    const resumeOnlyClaims = (latestResume?.skills ?? []).filter(
      (sk: string) => !evaluatedSet.has(sk.toLowerCase().trim()),
    );
    return {
      verifiedStrengths,
      interviewWeaknesses,
      resumeOnlyClaims,
    };
  }, [readiness, latestResume]);

  // Top 3–5 Priority Skill Gaps with related job counts
  const prioritySkillGaps = useMemo(() => {
    const counts = new Map<
      string,
      { skill: string; count: number; isWeak: boolean; sampleJobId?: string }
    >();

    for (const s of readiness?.skills ?? []) {
      if (s.status === "WEAK") {
        const key = s.skill.toLowerCase().trim();
        counts.set(key, {
          skill: s.skill,
          count: 1,
          isWeak: true,
        });
      }
    }

    for (const app of applications ?? []) {
      for (const gap of app.skillGaps ?? []) {
        const key = gap.toLowerCase().trim();
        if (!key) continue;
        const existing = counts.get(key);
        if (existing) {
          existing.count += 1;
          existing.sampleJobId = existing.sampleJobId || app.jobId;
        } else {
          counts.set(key, {
            skill: gap,
            count: 1,
            isWeak: false,
            sampleJobId: app.jobId,
          });
        }
      }
    }

    return [...counts.values()]
      .sort((a, b) => Number(b.isWeak) - Number(a.isWeak) || b.count - a.count)
      .slice(0, 5);
  }, [readiness, applications]);

  // Recommended Jobs: combine tracked roles with match data + verified catalog roles
  const recommendedJobs = useMemo(() => {
    const resumeSkillSet = new Set(
      (latestResume?.skills ?? []).map((s: string) => s.toLowerCase().trim()),
    );

    if (applications && applications.length > 0) {
      return applications.slice(0, 4).map((app: Application) => ({
        id: app.jobId,
        title: app.job.title,
        company: app.job.company,
        location: app.job.location ?? "Remote / Hybrid",
        source: "Greenhouse",
        matchScore: app.matchScore != null ? Math.round(app.matchScore) : null,
        missingSkills: app.skillGaps ?? [],
        status: app.status,
      }));
    }

    return (publicJobs ?? []).slice(0, 4).map((job) => {
      const jobSkills = job.skills ?? [];
      const missing = jobSkills.filter(
        (s) => !resumeSkillSet.has(s.toLowerCase().trim()),
      );
      const matchedCount = jobSkills.length - missing.length;
      const computedScore =
        jobSkills.length > 0 && latestResume
          ? Math.round((matchedCount / jobSkills.length) * 100)
          : null;

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location ?? "Verified Listing",
        source: job.source ?? "Greenhouse",
        matchScore: computedScore,
        missingSkills: missing,
        status: null,
      };
    });
  }, [applications, publicJobs, latestResume]);

  // Recent Activity Feed
  const recentActivity = useMemo(() => {
    const items: {
      id: string;
      typeLabel: string;
      title: string;
      detail: string;
      date: string;
      actionLabel: string;
      to: string;
      tone: "primary" | "success" | "warning" | "neutral";
    }[] = [];

    if (latestResume) {
      items.push({
        id: `resume-${latestResume.id}`,
        typeLabel: "Resume uploaded",
        title: latestResume.fileName ?? latestResume.title,
        detail: `${latestResume.skills.length} technical skills extracted for matching`,
        date: latestResume.createdAt,
        actionLabel: "Review skills",
        to: "/resume",
        tone: "primary",
      });
    }

    for (const s of (readiness?.skills ?? []).slice(0, 3)) {
      items.push({
        id: `skill-${s.skill}-${s.updatedAt}`,
        typeLabel:
          s.status === "STRONG" ? "Skill verified" : "Interview feedback",
        title: `${s.skill} marked ${s.status === "STRONG" ? "Verified" : "Needs practice"}`,
        detail: s.evidence || "Updated from mock interview rubric evaluation",
        date: s.updatedAt,
        actionLabel: "View evidence",
        to: "/readiness",
        tone: s.status === "STRONG" ? "success" : "warning",
      });
    }

    for (const app of (applications ?? []).slice(0, 3)) {
      items.push({
        id: `app-${app.id}`,
        typeLabel: `Application · ${app.status}`,
        title: `${app.job.title} at ${app.job.company}`,
        detail:
          app.matchScore != null
            ? `${Math.round(app.matchScore)}% requirement coverage · ${
                app.skillGaps?.length ?? 0
              } gaps`
            : "Added to application tracker",
        date: app.updatedAt,
        actionLabel: "View match",
        to: `/matches/${app.jobId}${latestResume ? `?resumeId=${latestResume.id}` : ""}`,
        tone: "neutral",
      });
    }

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [latestResume, readiness, applications]);

  const metricsLoading = resumesLoading || appsLoading || readinessLoading;

  const metricCards = [
    {
      label: "Overall Readiness Score",
      value: `${metrics.readinessScore}%`,
      explanation:
        metrics.verified > 0
          ? `Weighted across ${metrics.verified} interview-verified and ${metrics.extractedSkills} resume skills.`
          : metrics.extractedSkills > 0
            ? `Based on ${metrics.extractedSkills} extracted resume skills awaiting interview verification.`
            : "Upload a resume and complete a mock interview to calculate readiness.",
      actionLabel: "View readiness report",
      to: "/readiness",
      toneClass: "text-primary",
      icon: <Award className="h-4 w-4 text-primary" />,
    },
    {
      label: "Skills Verified",
      value: `${metrics.verified}`,
      explanation:
        metrics.verified > 0
          ? "Skills proven with strong scores in targeted mock interviews."
          : "No skills verified in interviews yet — start a mock session.",
      actionLabel:
        metrics.verified > 0 ? "Inspect verified skills" : "Start an interview",
      to: metrics.verified > 0 ? "/readiness" : "/interviews",
      toneClass: "text-status-success",
      icon: <CheckCircle2 className="h-4 w-4 text-status-success" />,
    },
    {
      label: "Priority Skill Gaps",
      value: `${prioritySkillGaps.length}`,
      explanation:
        prioritySkillGaps.length > 0
          ? `${metrics.needsPractice} flagged in interviews and ${Math.max(
              0,
              prioritySkillGaps.length - metrics.needsPractice,
            )} missing across target roles.`
          : "Compare your resume with jobs to surface missing requirements.",
      actionLabel: "Practice top gaps",
      to: "/skills",
      toneClass: "text-status-warning",
      icon: <Target className="h-4 w-4 text-status-warning" />,
    },
    {
      label: "Active Applications",
      value: `${metrics.activePipeline}`,
      explanation:
        metrics.activePipeline > 0
          ? `Roles currently tracked across Saved, Applied, and Interviewing.`
          : "Save and match engineering roles to track your pipeline.",
      actionLabel:
        metrics.activePipeline > 0 ? "Open pipeline tracker" : "Explore jobs",
      to: metrics.activePipeline > 0 ? "/applications" : "/jobs",
      toneClass: "text-content-heading",
      icon: <Briefcase className="h-4 w-4 text-content-secondary" />,
    },
  ];

  return (
    <ContentContainer size="xl" className="space-y-6">
      {/* 1. Welcome Header */}
      <PageHeader
        eyebrow="Verified Skill Profile · Home"
        title={
          firstName
            ? `${firstName}'s Verified Skill Profile`
            : "Verified Skill Profile"
        }
        description="Resume claim → interview → evidence → updated profile → better next match. Every skill is separated into proven strengths, unverified resume claims, interview weaknesses, and critical gaps."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => navigate("/readiness")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Open full skill ledger
          </Button>
        }
        secondaryActions={
          <Button variant="outline" onClick={() => navigate("/jobs")}>
            Match against jobs
          </Button>
        }
      />

      {(resumesError || appsError) && (
        <ErrorState
          title="Some workspace data could not be loaded"
          message="Please retry to refresh your latest resumes and tracked applications."
          onRetry={() => {
            void refetchResumes();
            void refetchApps();
          }}
        />
      )}

      {/* 2. Lead With Next Best Action */}
      <ReadinessPanel />

      {/* 2B. Visible Closed Loop + 4-Quadrant Verified Skill Profile Hub */}
      <SectionCard
        eyebrow="Closed-Loop Verification Engine"
        title="Verified Skill Profile & Match Improvement Potential"
        description="TrueHire updates your profile after every interview so your next job match reflects verified capability rather than unvalidated keywords."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {readiness?.matchImprovement &&
              readiness.matchImprovement.trackedJobsCount > 0 && (
                <Badge tone="success" size="sm">
                  Match potential:{" "}
                  {readiness.matchImprovement.currentAvgMatchPct}% →{" "}
                  {readiness.matchImprovement.projectedAvgMatchPct}% (+
                  {readiness.matchImprovement.potentialGainPct}%)
                </Badge>
              )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/readiness")}
            >
              Inspect interview history per skill
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Closed-Loop Stepper */}
          <div className="grid gap-2.5 sm:grid-cols-5">
            {[
              {
                step: "1. Resume Claims",
                value: `${latestResume?.skills.length ?? 0} listed`,
                note: latestResume
                  ? latestResume.fileName || latestResume.title
                  : "Upload resume",
                tone: "neutral" as const,
              },
              {
                step: "2. Interviews",
                value: `${(readiness?.skills ?? []).length} tested`,
                note: "Rubric-scored Q&A",
                tone: "primary" as const,
              },
              {
                step: "3. Evidence",
                value: `${skillProfileBuckets.verifiedStrengths.length} strong`,
                note: `${skillProfileBuckets.interviewWeaknesses.length} weak exposed`,
                tone: "success" as const,
              },
              {
                step: "4. Updated Profile",
                value: `${metrics.readinessScore}% ready`,
                note: "Weak claims withheld",
                tone: "primary" as const,
              },
              {
                step: "5. Better Next Match",
                value:
                  readiness?.matchImprovement &&
                  readiness.matchImprovement.potentialGainPct > 0
                    ? `+${readiness.matchImprovement.potentialGainPct}% gain`
                    : "Live sync",
                note: readiness?.matchImprovement?.topUnlockSkill
                  ? `Top target: ${readiness.matchImprovement.topUnlockSkill}`
                  : "Explore roles",
                tone: "success" as const,
              },
            ].map((stage) => (
              <Card key={stage.step} muted padding="sm" className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-semibold text-content-secondary">
                    {stage.step}
                  </span>
                  <Badge tone={stage.tone} size="sm">
                    {stage.value}
                  </Badge>
                </div>
                <p className="truncate text-xs text-content-heading font-medium">
                  {stage.note}
                </p>
              </Card>
            ))}
          </div>

          {/* 4 Quadrants: Verified Strengths | Interview Weaknesses | Resume-Only Claims | Critical Missing Skills */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Quadrant 1: Verified Strengths */}
            <Card padding="sm" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-success">
                  <ShieldCheck className="h-4 w-4" />
                  Verified Strengths (
                  {skillProfileBuckets.verifiedStrengths.length})
                </span>
                <span className="text-[11px] text-content-secondary">
                  Interview-proven
                </span>
              </div>
              {skillProfileBuckets.verifiedStrengths.length === 0 ? (
                <p className="text-xs text-content-secondary">
                  No interview-verified strengths yet. Complete a targeted
                  interview to prove your top resume skills.
                </p>
              ) : (
                <ul className="space-y-2">
                  {skillProfileBuckets.verifiedStrengths
                    .slice(0, 4)
                    .map((s) => (
                      <li
                        key={s.skill}
                        className="rounded-input border border-border bg-muted/40 p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="font-semibold text-content-heading">
                            {s.skill}
                          </strong>
                          <span className="text-[11px] text-content-secondary tabular-nums">
                            {new Date(s.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-content-secondary">
                          {s.evidence}
                        </p>
                      </li>
                    ))}
                </ul>
              )}
            </Card>

            {/* Quadrant 2: Interview-Identified Weaknesses */}
            <Card padding="sm" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Interview-Identified Weaknesses (
                  {skillProfileBuckets.interviewWeaknesses.length})
                </span>
                <span className="text-[11px] text-content-secondary">
                  Credit withheld
                </span>
              </div>
              {skillProfileBuckets.interviewWeaknesses.length === 0 ? (
                <p className="text-xs text-content-secondary">
                  Zero skills currently flagged weak in mock interviews.
                </p>
              ) : (
                <ul className="space-y-2">
                  {skillProfileBuckets.interviewWeaknesses
                    .slice(0, 4)
                    .map((s) => (
                      <li
                        key={s.skill}
                        className="flex items-center justify-between gap-2 rounded-input border border-border bg-muted/40 p-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <strong className="font-semibold text-content-heading">
                            {s.skill}
                          </strong>
                          <p className="truncate text-content-secondary">
                            {s.evidence} ·{" "}
                            {new Date(s.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate("/jobs")}
                        >
                          Re-verify
                        </Button>
                      </li>
                    ))}
                </ul>
              )}
            </Card>

            {/* Quadrant 3: Resume-Only Claims */}
            <Card padding="sm" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <FileText className="h-4 w-4" />
                  Resume-Only Claims (
                  {skillProfileBuckets.resumeOnlyClaims.length})
                </span>
                <span className="text-[11px] text-content-secondary">
                  {latestResume
                    ? `Uploaded ${new Date(latestResume.createdAt).toLocaleDateString()}`
                    : "Unvalidated"}
                </span>
              </div>
              {skillProfileBuckets.resumeOnlyClaims.length === 0 ? (
                <p className="text-xs text-content-secondary">
                  {latestResume
                    ? "All extracted resume skills have been evaluated!"
                    : "Upload a resume to extract your initial skill claims."}
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {skillProfileBuckets.resumeOnlyClaims
                      .slice(0, 10)
                      .map((skill) => (
                        <Badge key={skill} tone="neutral" size="sm">
                          {skill}
                        </Badge>
                      ))}
                    {skillProfileBuckets.resumeOnlyClaims.length > 10 && (
                      <Badge tone="neutral" size="sm">
                        +{skillProfileBuckets.resumeOnlyClaims.length - 10} more
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-content-secondary">
                    Listed on your resume but not yet verified in an interview.
                  </p>
                </div>
              )}
            </Card>

            {/* Quadrant 4: Critical Missing Skills & Match Improvement Potential */}
            <Card padding="sm" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-danger">
                  <TrendingUp className="h-4 w-4" />
                  Critical Missing Skills ({prioritySkillGaps.length})
                </span>
                <span className="text-[11px] text-content-secondary">
                  Highest match upside
                </span>
              </div>
              {prioritySkillGaps.length === 0 ? (
                <p className="text-xs text-content-secondary">
                  Match with a role to surface critical missing skills and
                  projected score gains.
                </p>
              ) : (
                <ul className="space-y-2">
                  {prioritySkillGaps.slice(0, 4).map((gap) => (
                    <li
                      key={gap.skill}
                      className="flex items-center justify-between gap-2 rounded-input border border-border bg-muted/40 p-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <strong className="font-semibold text-content-heading">
                          {gap.skill}
                        </strong>
                        <p className="truncate text-content-secondary">
                          Required in {gap.count}{" "}
                          {gap.count === 1 ? "role" : "roles"} · +8–15% match
                          potential
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            gap.sampleJobId
                              ? `/skill-gaps/${gap.sampleJobId}?focusSkill=${encodeURIComponent(gap.skill)}`
                              : "/jobs",
                          )
                        }
                      >
                        Close gap
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </SectionCard>

      {/* 3. Actionable Readiness Metrics (Label + Value + Explanation + Action) */}
      <section
        aria-label="Readiness overview metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {metricCards.map((item) => (
          <Card
            key={item.label}
            padding="sm"
            className="flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-content-secondary">
                  {item.label}
                </span>
                {item.icon}
              </div>

              {metricsLoading ? (
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ) : (
                <>
                  <p
                    className={`text-2xl font-semibold tracking-tight tabular-nums ${item.toneClass}`}
                  >
                    {item.value}
                  </p>
                  <p className="text-xs leading-relaxed text-content-secondary">
                    {item.explanation}
                  </p>
                </>
              )}
            </div>

            <div className="border-t border-border pt-2.5">
              <button
                type="button"
                onClick={() => navigate(item.to)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </section>

      {/* 4. Priority Skill Gaps & Recommended Jobs */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left 6 cols: Priority Skill Gaps */}
        <div className="lg:col-span-6">
          <SectionCard
            eyebrow="Gap Prioritization"
            title="Priority Skill Gaps"
            description="Skills flagged in mock interviews or missing across your tracked roles."
            loading={metricsLoading}
            empty={prioritySkillGaps.length === 0}
            emptyTitle="No skill gaps identified yet"
            emptyDescription="Compare your resume with a verified job posting to rank missing skills by role frequency."
            emptyAction={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/jobs")}
              >
                Compare with a job
              </Button>
            }
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/skills")}
              >
                All skills
              </Button>
            }
          >
            <div className="space-y-2.5">
              {prioritySkillGaps.map((gap) => (
                <RequirementRow
                  key={gap.skill}
                  skill={gap.skill}
                  status={gap.isWeak ? "WEAK" : "MISSING"}
                  priority={gap.isWeak || gap.count >= 2 ? "high" : "medium"}
                  frequencyLabel={`Appears in ${gap.count} ${
                    gap.count === 1 ? "role" : "roles"
                  }`}
                  evidence={
                    gap.isWeak
                      ? "Flagged in mock interview — practice to convert to Verified"
                      : "Missing from your active resume profile"
                  }
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          gap.sampleJobId
                            ? `/skill-gaps/${gap.sampleJobId}${
                                latestResume
                                  ? `?resumeId=${latestResume.id}`
                                  : ""
                              }`
                            : "/jobs",
                        )
                      }
                    >
                      Practice this skill
                    </Button>
                  }
                />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right 6 cols: Recommended Jobs */}
        <div className="lg:col-span-6">
          <SectionCard
            eyebrow="Role Discovery"
            title="Recommended Jobs"
            description="Verified roles matched against your current skill profile."
            loading={appsLoading}
            empty={recommendedJobs.length === 0}
            emptyTitle="No recommended jobs yet"
            emptyDescription="Browse the verified job directory to inspect requirement coverage and missing skills."
            emptyAction={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/jobs")}
              >
                Explore verified jobs
              </Button>
            }
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/jobs")}
              >
                Browse all
              </Button>
            }
          >
            <div className="space-y-3">
              {recommendedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  id={job.id}
                  title={job.title}
                  company={job.company}
                  location={job.location}
                  source={job.source}
                  matchScore={job.matchScore}
                  appliedStatus={job.status}
                  skills={
                    job.missingSkills.length > 0
                      ? job.missingSkills.map((s: string) => `Missing: ${s}`)
                      : ["All listed skills matched"]
                  }
                  onSelect={() =>
                    navigate(
                      `/matches/${job.id}${
                        latestResume ? `?resumeId=${latestResume.id}` : ""
                      }`,
                    )
                  }
                  actions={
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/matches/${job.id}${
                              latestResume ? `?resumeId=${latestResume.id}` : ""
                            }`,
                          )
                        }
                      >
                        View match
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/skill-gaps/${job.id}${
                              latestResume ? `?resumeId=${latestResume.id}` : ""
                            }`,
                          )
                        }
                      >
                        Skill gaps
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* 5. Recent Activity & Active Resume Status */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Activity (8 cols) */}
        <div className="lg:col-span-8">
          <SectionCard
            eyebrow="Closed-Loop Log"
            title="Recent Activity"
            description="Latest updates across your resumes, job matches, and interview evaluations."
            loading={metricsLoading}
            empty={recentActivity.length === 0}
            emptyTitle="No activity recorded yet"
            emptyDescription="Upload a resume or match with a role to start building your readiness history."
            emptyAction={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/resume")}
              >
                Upload resume
              </Button>
            }
          >
            <ul className="divide-y divide-border">
              {recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={item.tone} size="sm">
                        {item.typeLabel}
                      </Badge>
                      <span className="text-sm font-semibold text-content-heading truncate">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-content-secondary">
                      {item.detail}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs text-content-secondary tabular-nums">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(item.to)}
                    >
                      {item.actionLabel}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        {/* Active Resume Baseline (4 cols) */}
        <div className="lg:col-span-4">
          <SectionCard
            eyebrow="Matching Source"
            title="Active Resume"
            description="Used to compute requirement coverage."
            loading={resumesLoading}
            empty={!latestResume}
            emptyTitle="No resume uploaded"
            emptyDescription="Upload a PDF or DOCX resume to extract your skills and run deterministic job matches."
            emptyAction={
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/resume")}
              >
                Upload resume
              </Button>
            }
            action={
              latestResume ? (
                <Badge tone="success" size="sm">
                  Active
                </Badge>
              ) : undefined
            }
          >
            {latestResume && (
              <div className="space-y-4">
                <Card muted padding="sm" className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <p className="truncate text-sm font-semibold text-content-heading">
                      {latestResume.fileName ?? latestResume.title}
                    </p>
                  </div>
                  <p className="text-xs text-content-secondary tabular-nums">
                    Uploaded{" "}
                    {new Date(latestResume.createdAt).toLocaleDateString()} ·{" "}
                    {latestResume.skills.length} skills extracted
                  </p>
                </Card>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-content-secondary">
                    Extracted skills sample
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {latestResume.skills.slice(0, 8).map((skill: string) => (
                      <Badge key={skill} tone="neutral" size="sm">
                        {skill}
                      </Badge>
                    ))}
                    {latestResume.skills.length > 8 && (
                      <Badge tone="neutral" size="sm">
                        +{latestResume.skills.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => navigate("/resume")}
                >
                  Manage or replace resume
                </Button>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </ContentContainer>
  );
};

export default DashboardPage;
