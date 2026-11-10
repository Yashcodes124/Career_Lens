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
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { ReadinessPanel } from "../readiness/ReadinessPanel";
import { useReadiness } from "../readiness/useReadiness";
import type { ReadinessSkill } from "../readiness/readinessApi";
import { useResumes } from "../resume/useResumes";
import { useApplications } from "../tracker/useApplications";
import type { Application } from "../tracker/types";
import { apiClient } from "../../lib/api-client";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
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
      const res = await apiClient.get<
        { data?: JobSummary[] | { jobs?: JobSummary[] } } | JobSummary[]
      >("/jobs");
      if (Array.isArray(res)) return res.slice(0, 4);
      if (res && typeof res === "object" && "data" in res) {
        if (Array.isArray(res.data)) return res.data.slice(0, 4);
        if (res.data && Array.isArray(res.data.jobs)) {
          return res.data.jobs.slice(0, 4);
        }
      }
      return [];
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
        eyebrow="Readiness Workspace"
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description="Review your next best action, address priority skill gaps, and track requirement coverage on verified roles."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => navigate("/jobs")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Continue preparation
          </Button>
        }
        secondaryActions={
          <Button variant="outline" onClick={() => navigate("/readiness")}>
            View skill profile
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
