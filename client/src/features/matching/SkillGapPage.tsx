import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  ExternalLink,
  FileText,
  MessageSquare,
  PlayCircle,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { calculateJobMatch } from "./matchingApi";
import type { GapPriority, MatchResult } from "./types";
import { getResourcesForSkill, type SkillResourceLink } from "./skillResources";
import { useResumes } from "../resume/useResumes";
import { useReadiness } from "../readiness/useReadiness";
import type { ReadinessSkill } from "../readiness/readinessApi";
import { useApplications } from "../tracker/useApplications";
import type { Application } from "../tracker/types";
import type { Job } from "../jobs/types";
import { apiClient } from "../../lib/api-client";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  ProgressBar,
  SectionCard,
  Select,
  Skeleton,
  SkillBadge,
  Tabs,
  type BadgeTone,
  type SkillReadinessLevel,
} from "../../components/ui";

interface PrioritizedGapItem {
  skill: string;
  priority: GapPriority;
  jobsRequiringCount: number;
  relatedRoles: string[];
  currentStatusLabel: string;
  statusLevel: SkillReadinessLevel;
  evidence: string;
  recommendedAction: string;
}

const RESOURCE_ICON: Record<SkillResourceLink["type"], React.ReactNode> = {
  DOCS: <BookOpen className="h-3.5 w-3.5 text-primary" />,
  ROADMAP: <Compass className="h-3.5 w-3.5 text-primary" />,
  PRACTICE: <Code2 className="h-3.5 w-3.5 text-status-success" />,
  COURSE: <PlayCircle className="h-3.5 w-3.5 text-status-warning" />,
};

const buildSampleQuestionsForSkill = (
  skill: string,
  roleTitle: string,
): string[] => [
  `Walk through a production scenario where you used or would design with ${skill} in a ${roleTitle} role. What trade-offs matter most?`,
  `What are the most common failure modes, performance bottlenecks, or security pitfalls when working with ${skill}?`,
  `How would you test, monitor, and debug a feature relying on ${skill} under high load?`,
];

export const SkillGapPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryResumeId = searchParams.get("resumeId");
  const initialFocusSkill = searchParams.get("focusSkill");

  const { data: resumes, isLoading: resumesLoading } = useResumes();
  const { data: readiness } = useReadiness();
  const { data: applications } = useApplications();

  const activeResume = useMemo(
    () => resumes?.find((r) => r.id === queryResumeId) ?? resumes?.[0] ?? null,
    [resumes, queryResumeId],
  );
  const activeResumeId = activeResume?.id ?? null;

  const [job, setJob] = useState<Job | null>(null);
  const [matchData, setMatchData] = useState<MatchResult | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeViewTab, setActiveViewTab] = useState<string>("role");
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(
    initialFocusSkill,
  );

  // Practice Interview Modal State
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "MEDIUM",
  );
  const [interviewType, setInterviewType] = useState<string>("TECHNICAL");
  const [selectedFocusSkills, setSelectedFocusSkills] = useState<string[]>([]);
  const [customFocusSkill, setCustomFocusSkill] = useState("");
  const [isCreatingInterview, setIsCreatingInterview] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  // Fetch job metadata
  useEffect(() => {
    if (!jobId) return;
    apiClient
      .get<{ data?: Job } | Job>(`/jobs/${jobId}`)
      .then((res) => {
        const unwrapped =
          res && typeof res === "object" && "data" in res && res.data
            ? res.data
            : (res as Job);
        if (unwrapped?.title) setJob(unwrapped);
      })
      .catch(() => null);
  }, [jobId]);

  const loadSkillGaps = async () => {
    if (!jobId || !activeResumeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await calculateJobMatch({
        resumeId: activeResumeId,
        jobId,
      });
      setMatchData(response.data);
      setApplicationId(response.data.applicationId ?? null);

      const firstGap =
        initialFocusSkill || response.data.skillGaps?.[0]?.skill || null;
      setSelectedSkillName((prev) => prev ?? firstGap);
      setSelectedFocusSkills(
        response.data.skillGaps.slice(0, 3).map((g) => g.skill),
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load skill gap analysis.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resumesLoading) return;
    void loadSkillGaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, activeResumeId, resumesLoading]);

  // Cross-job gap frequency & related role titles
  const crossJobStats = useMemo(() => {
    const map = new Map<
      string,
      { skill: string; count: number; roles: string[] }
    >();

    for (const app of (applications ?? []) as Application[]) {
      const roleLabel = `${app.job.title} (${app.job.company})`;
      for (const gap of app.skillGaps ?? []) {
        const key = gap.toLowerCase().trim();
        if (!key) continue;
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          if (!existing.roles.includes(roleLabel)) {
            existing.roles.push(roleLabel);
          }
        } else {
          map.set(key, {
            skill: gap,
            count: 1,
            roles: [roleLabel],
          });
        }
      }
    }
    return map;
  }, [applications]);

  const readinessMap = useMemo(() => {
    const map = new Map<string, ReadinessSkill>();
    for (const s of readiness?.skills ?? []) {
      map.set(s.skill.toLowerCase().trim(), s);
    }
    return map;
  }, [readiness]);

  const roleTitle =
    job?.title ??
    applications?.find((a) => a.jobId === jobId)?.job.title ??
    "Target Engineering Role";
  const companyName =
    job?.company ??
    applications?.find((a) => a.jobId === jobId)?.job.company ??
    "Verified Company";

  // Build prioritized queue for this role
  const roleGapQueue = useMemo<PrioritizedGapItem[]>(() => {
    if (!matchData) return [];

    return matchData.skillGaps.map((gap) => {
      const key = gap.skill.toLowerCase().trim();
      const crossStat = crossJobStats.get(key);
      const readinessEntry = readinessMap.get(key);
      const onResume = (activeResume?.skills ?? []).some(
        (s) => s.toLowerCase().trim() === key,
      );

      let currentStatusLabel = "Not started · Missing on resume";
      let statusLevel: SkillReadinessLevel = "MISSING";

      if (readinessEntry?.status === "WEAK") {
        currentStatusLabel = "Needs practice · Flagged in interview";
        statusLevel = "WEAK";
      } else if (readinessEntry?.status === "STRONG") {
        currentStatusLabel = "Verified in interview";
        statusLevel = "VERIFIED";
      } else if (onResume) {
        currentStatusLabel = "Listed on resume · Unverified";
        statusLevel = "EXTRACTED";
      }

      const jobsRequiringCount = Math.max(1, crossStat?.count ?? 1);
      const relatedRoles = crossStat?.roles?.length
        ? crossStat.roles
        : [`${roleTitle} (${companyName})`];

      return {
        skill: gap.skill,
        priority: gap.priority,
        jobsRequiringCount,
        relatedRoles,
        currentStatusLabel,
        statusLevel,
        evidence: readinessEntry?.evidence
          ? `${gap.evidence} · Interview note: ${readinessEntry.evidence}`
          : gap.evidence,
        recommendedAction:
          readinessEntry?.status === "WEAK"
            ? `Retake a 15-minute targeted interview on ${gap.skill} to resolve weak rubric feedback.`
            : `Practice ${gap.skill} in a 15-minute targeted mock interview for ${roleTitle}.`,
      };
    });
  }, [
    matchData,
    crossJobStats,
    readinessMap,
    activeResume,
    roleTitle,
    companyName,
  ]);

  // Build Cross-Job Skill Gaps Overview (across all saved/tracked applications)
  const overviewGapQueue = useMemo<PrioritizedGapItem[]>(() => {
    const merged = new Map<string, PrioritizedGapItem>();

    for (const item of roleGapQueue) {
      merged.set(item.skill.toLowerCase().trim(), item);
    }

    for (const [key, stat] of crossJobStats.entries()) {
      if (merged.has(key)) continue;
      const readinessEntry = readinessMap.get(key);
      const priority: GapPriority =
        stat.count >= 3 ? "high" : stat.count === 2 ? "medium" : "low";

      merged.set(key, {
        skill: stat.skill,
        priority,
        jobsRequiringCount: stat.count,
        relatedRoles: stat.roles,
        currentStatusLabel:
          readinessEntry?.status === "WEAK"
            ? "Needs practice · Flagged in interview"
            : "Missing across tracked roles",
        statusLevel: readinessEntry?.status === "WEAK" ? "WEAK" : "MISSING",
        evidence: `Required in ${stat.count} tracked ${
          stat.count === 1 ? "application" : "applications"
        } (${stat.roles.slice(0, 2).join(", ")}).`,
        recommendedAction: `Practice ${stat.skill} in a targeted interview to unlock ${stat.count} tracked ${
          stat.count === 1 ? "role" : "roles"
        }.`,
      });
    }

    const priorityOrder: Record<GapPriority, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };

    return [...merged.values()].sort(
      (a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        b.jobsRequiringCount - a.jobsRequiringCount,
    );
  }, [roleGapQueue, crossJobStats, readinessMap]);

  const activeQueue =
    activeViewTab === "overview" ? overviewGapQueue : roleGapQueue;

  const selectedGapItem = useMemo(
    () =>
      activeQueue.find(
        (g) => g.skill.toLowerCase() === selectedSkillName?.toLowerCase(),
      ) ??
      activeQueue[0] ??
      null,
    [activeQueue, selectedSkillName],
  );

  const openPracticeModalForSkill = (skill?: string) => {
    setInterviewError(null);
    if (skill) {
      setSelectedSkillName(skill);
      setSelectedFocusSkills((prev) =>
        prev.includes(skill) ? prev : [skill, ...prev.slice(0, 2)],
      );
    } else if (selectedFocusSkills.length === 0 && activeQueue.length > 0) {
      setSelectedFocusSkills(activeQueue.slice(0, 3).map((g) => g.skill));
    }
    setInterviewModalOpen(true);
  };

  const toggleFocusSkillInModal = (skill: string) => {
    setSelectedFocusSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleAddCustomFocusSkill = () => {
    const trimmed = customFocusSkill.trim();
    if (!trimmed) return;
    if (!selectedFocusSkills.includes(trimmed)) {
      setSelectedFocusSkills((prev) => [...prev, trimmed]);
    }
    setCustomFocusSkill("");
  };

  const handleCreateTargetedInterview = async () => {
    setInterviewError(null);
    setIsCreatingInterview(true);

    try {
      let targetAppId =
        applicationId ??
        applications?.find((a) => a.jobId === jobId)?.id ??
        null;

      if (!targetAppId && jobId && activeResumeId) {
        const matchRes = await calculateJobMatch({
          resumeId: activeResumeId,
          jobId,
        });
        targetAppId = matchRes.data.applicationId;
      }

      if (!targetAppId) {
        throw new Error(
          "Could not resolve application record for this interview.",
        );
      }

      const focusList =
        selectedFocusSkills.length > 0
          ? selectedFocusSkills
          : activeQueue.slice(0, 3).map((g) => g.skill);

      const response = await apiClient.post<
        { data?: { id?: string; interviewId?: string } } | { id?: string }
      >("/interviews", {
        applicationId: targetAppId,
        jobId,
        resumeId: activeResumeId,
        durationMinutes,
        difficulty,
        interviewType,
        focusSkills: focusList,
      });

      const createdId =
        (response as { data?: { id?: string; interviewId?: string } })?.data
          ?.id ??
        (response as { data?: { id?: string; interviewId?: string } })?.data
          ?.interviewId ??
        (response as { id?: string })?.id;

      if (!createdId) {
        throw new Error("Interview created, but no session ID was returned.");
      }

      setInterviewModalOpen(false);
      navigate(`/interviews/${createdId}/prep`, {
        state: {
          durationMinutes,
          difficulty,
          focusSkills: focusList,
          roleTitle,
          companyName,
        },
      });
    } catch (err: unknown) {
      setInterviewError(
        err instanceof Error
          ? err.message
          : "Could not start practice interview. Please try again.",
      );
    } finally {
      setIsCreatingInterview(false);
    }
  };

  const priorityTone: Record<GapPriority, BadgeTone> = {
    high: "danger",
    medium: "warning",
    low: "neutral",
  };

  const verifiedCount = (readiness?.skills ?? []).filter(
    (s: ReadinessSkill) => s.status === "STRONG",
  ).length;
  const weakCount = (readiness?.skills ?? []).filter(
    (s: ReadinessSkill) => s.status === "WEAK",
  ).length;

  return (
    <ContentContainer size="xl" className="space-y-6">
      {/* 1. Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Explore Jobs", href: "/jobs" },
          ...(jobId ? [{ label: roleTitle, href: `/matches/${jobId}` }] : []),
          { label: "Skill Gaps" },
        ]}
        eyebrow={`${companyName} · ${roleTitle}`}
        title="Skill Gaps"
        description="Focus on the skills that appear most often across your target roles."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => openPracticeModalForSkill(selectedGapItem?.skill)}
            disabled={!activeResumeId}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Start practice interview
          </Button>
        }
        secondaryActions={
          jobId ? (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/matches/${jobId}${
                      activeResumeId ? `?resumeId=${activeResumeId}` : ""
                    }`,
                  )
                }
              >
                View match breakdown
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/tailor/${jobId}${
                      activeResumeId ? `?resumeId=${activeResumeId}` : ""
                    }`,
                  )
                }
                leftIcon={<Sparkles className="h-4 w-4 text-primary" />}
              >
                Tailor resume
              </Button>
            </>
          ) : undefined
        }
      />

      {loading || resumesLoading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Skeleton className="h-80 w-full" />
            </div>
            <div className="lg:col-span-5">
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </div>
      ) : !activeResumeId ? (
        <EmptyState
          title="Upload a resume to analyze skill gaps"
          description="TrueHire compares your extracted resume skills and interview history against role requirements to prioritize your gaps."
          icon={<FileText className="h-5 w-5" />}
          action={
            <Button variant="primary" onClick={() => navigate("/resume")}>
              Upload resume
            </Button>
          }
        />
      ) : error ? (
        <ErrorState
          title="Could not load skill gaps"
          message={error}
          onRetry={() => void loadSkillGaps()}
        />
      ) : (
        <>
          {/* Mode Switcher: Role Skill Gaps vs. Cross-Job Skill Gaps Overview */}
          <Tabs
            activeTab={activeViewTab}
            onChange={setActiveViewTab}
            items={[
              {
                id: "role",
                label: `Role Skill Gaps (${roleGapQueue.length})`,
                count: roleGapQueue.length,
              },
              {
                id: "overview",
                label: `Skill Gaps Overview Across Saved Jobs (${overviewGapQueue.length})`,
                count: overviewGapQueue.length,
              },
            ]}
          />

          {/* Top Summary Banner */}
          {activeQueue.length > 0 && (
            <Card
              muted
              padding="md"
              className="flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-content-heading">
                  Your strongest gap is {activeQueue[0].skill}. It appears in{" "}
                  {activeQueue[0].jobsRequiringCount} of your saved jobs.
                </p>
                <p className="text-xs text-content-secondary">
                  Select any skill below to inspect why it matters, view curated
                  documentation, and start a 15-minute practice interview.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openPracticeModalForSkill(activeQueue[0].skill)}
              >
                Practice {activeQueue[0].skill}
              </Button>
            </Card>
          )}

          {/* 2. Priority Gaps Queue + 3. Selected Skill Detail & Learning Resources */}
          {activeQueue.length === 0 ? (
            <EmptyState
              title="No missing skill gaps for this view"
              description="Your active resume and verified interview profile satisfy all extracted requirements for this role."
              icon={<CheckCircle2 className="h-5 w-5 text-status-success" />}
              action={
                <Button
                  variant="primary"
                  onClick={() => openPracticeModalForSkill()}
                >
                  Start verification interview
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left 7 Columns: Prioritized Preparation Queue */}
              <div className="space-y-4 lg:col-span-7">
                <SectionCard
                  eyebrow="Prioritized Preparation Queue"
                  title={
                    activeViewTab === "overview"
                      ? "Cross-Job Skill Gaps Overview"
                      : `Priority Gaps for ${roleTitle}`
                  }
                  description="Each skill shows its priority, job frequency, current status, evidence, and recommended next action."
                >
                  <ul className="space-y-3">
                    {activeQueue.map((item) => {
                      const isSelected =
                        selectedGapItem?.skill.toLowerCase() ===
                        item.skill.toLowerCase();

                      return (
                        <li key={item.skill}>
                          <Card
                            padding="sm"
                            interactive
                            onClick={() => setSelectedSkillName(item.skill)}
                            className={`cursor-pointer space-y-2.5 ${
                              isSelected
                                ? "border-primary ring-1 ring-primary bg-primary-soft/20"
                                : ""
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-content-heading">
                                  {item.skill}
                                </span>
                                <Badge
                                  tone={priorityTone[item.priority]}
                                  size="sm"
                                >
                                  {item.priority} priority
                                </Badge>
                                <Badge tone="primary" size="sm">
                                  {item.jobsRequiringCount}{" "}
                                  {item.jobsRequiringCount === 1
                                    ? "job requires this"
                                    : "jobs require this"}
                                </Badge>
                                <SkillBadge
                                  skill={item.skill}
                                  level={item.statusLevel}
                                  meta={item.currentStatusLabel}
                                />
                              </div>

                              <Button
                                variant={isSelected ? "primary" : "outline"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPracticeModalForSkill(item.skill);
                                }}
                              >
                                Practice skill
                              </Button>
                            </div>

                            <p className="text-xs leading-relaxed text-content-body">
                              <strong className="font-medium text-content-heading">
                                Evidence:{" "}
                              </strong>
                              {item.evidence}
                            </p>

                            <p className="text-xs text-content-secondary">
                              <strong className="font-medium text-content-heading">
                                Next action:{" "}
                              </strong>
                              {item.recommendedAction}
                            </p>
                          </Card>
                        </li>
                      );
                    })}
                  </ul>
                </SectionCard>
              </div>

              {/* Right 5 Columns: Selected Skill Detail + Sample Questions + Learning Resources */}
              <div className="space-y-6 lg:col-span-5">
                {selectedGapItem && (
                  <SectionCard
                    eyebrow="Skill Detail & Practice Plan"
                    title={selectedGapItem.skill}
                    description={`Priority: ${selectedGapItem.priority.toUpperCase()} · Required in ${selectedGapItem.jobsRequiringCount} tracked ${
                      selectedGapItem.jobsRequiringCount === 1
                        ? "role"
                        : "roles"
                    }`}
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          openPracticeModalForSkill(selectedGapItem.skill)
                        }
                      >
                        Start practice interview
                      </Button>
                    }
                  >
                    <div className="space-y-4">
                      {/* Why this skill matters */}
                      <Card muted padding="sm" className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-content-heading">
                          Why This Skill Matters
                        </p>
                        <p className="text-xs leading-relaxed text-content-body">
                          {selectedGapItem.evidence} Closing this gap directly
                          improves your requirement coverage for{" "}
                          {selectedGapItem.relatedRoles
                            .slice(0, 2)
                            .join(" and ")}
                          .
                        </p>
                      </Card>

                      {/* Current Evidence & Status */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                          Current Status & Evidence
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <SkillBadge
                            skill={selectedGapItem.skill}
                            level={selectedGapItem.statusLevel}
                            meta={selectedGapItem.currentStatusLabel}
                          />
                        </div>
                        <p className="text-xs text-content-secondary">
                          {selectedGapItem.recommendedAction}
                        </p>
                      </div>

                      {/* Related Interview Questions Preview */}
                      <div className="space-y-2 border-t border-border pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                          Sample Interview Questions for {selectedGapItem.skill}
                        </p>
                        <ul className="space-y-2">
                          {buildSampleQuestionsForSkill(
                            selectedGapItem.skill,
                            roleTitle,
                          ).map((q, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 rounded-input border border-border bg-muted/40 p-3 text-xs leading-relaxed text-content-body"
                            >
                              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 4. Curated Learning Resources */}
                      <div className="space-y-2 border-t border-border pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                          Curated Learning Resources
                        </p>
                        <div className="space-y-2">
                          {getResourcesForSkill(selectedGapItem.skill).map(
                            (res) => (
                              <a
                                key={res.url}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 rounded-input border border-border bg-surface p-3 transition-colors hover:border-primary"
                              >
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-content-secondary">
                                    {RESOURCE_ICON[res.type]}
                                    <span>
                                      {res.type} · {res.provider}
                                    </span>
                                  </div>
                                  <p className="truncate text-xs font-semibold text-content-heading">
                                    {res.title}
                                  </p>
                                </div>
                                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-content-secondary" />
                              </a>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                )}
              </div>
            </div>
          )}

          {/* 5. Progress: Skill Readiness Over Time & Improvement Trend */}
          <SectionCard
            eyebrow="Readiness Progress"
            title="Skill Readiness & Interview Improvement Trend"
            description="Track how targeted interview evaluations convert missing or unverified skills into verified strengths."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Card muted padding="sm" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-content-secondary">
                    Skills Verified in Interviews
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-status-success" />
                </div>
                <p className="text-2xl font-semibold text-status-success tabular-nums">
                  {verifiedCount}
                </p>
                <p className="text-xs text-content-secondary">
                  Backed by strong rubric scores in mock interviews.
                </p>
              </Card>

              <Card muted padding="sm" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-content-secondary">
                    Skills Flagged for Practice
                  </span>
                  <AlertTriangle className="h-4 w-4 text-status-warning" />
                </div>
                <p className="text-2xl font-semibold text-status-warning tabular-nums">
                  {weakCount}
                </p>
                <p className="text-xs text-content-secondary">
                  Practiced in interviews — retake to reach Verified status.
                </p>
              </Card>

              <Card muted padding="sm" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-content-secondary">
                    Projected Match Gain
                  </span>
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-semibold text-primary tabular-nums">
                  {matchData?.tactical?.offense.projectedScoreAfterTop3
                    ? `${matchData.tactical.offense.projectedScoreAfterTop3}%`
                    : `${Math.min(100, (matchData?.score ?? 50) + 20)}%`}
                </p>
                <p className="text-xs text-content-secondary">
                  Projected role coverage after verifying your top 3 skill gaps.
                </p>
              </Card>
            </div>

            {readiness?.skills && readiness.skills.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                  Recent Interview Skill Updates
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {readiness.skills.slice(0, 4).map((item: ReadinessSkill) => (
                    <Card
                      key={`${item.skill}-${item.updatedAt}`}
                      padding="sm"
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-content-heading">
                          {item.skill}
                        </p>
                        <p className="text-xs text-content-secondary">
                          {item.evidence}
                        </p>
                      </div>
                      <Badge
                        tone={item.status === "STRONG" ? "success" : "warning"}
                        size="sm"
                      >
                        {item.status === "STRONG"
                          ? "Verified"
                          : "Needs practice"}
                      </Badge>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </>
      )}

      {/* Targeted Practice Interview Configuration Modal */}
      <Modal
        open={interviewModalOpen}
        onClose={() => setInterviewModalOpen(false)}
        title="Configure targeted practice interview"
        description={`${roleTitle} at ${companyName}`}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setInterviewModalOpen(false)}
              disabled={isCreatingInterview}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isCreatingInterview}
              onClick={() => void handleCreateTargetedInterview()}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Start practice interview
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {interviewError && (
            <ErrorState
              title="Could not create interview"
              message={interviewError}
            />
          )}

          {/* Duration Preset */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-content-heading">
              Session duration
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[15, 30, 45, 60].map((mins) => (
                <Button
                  key={mins}
                  variant={durationMinutes === mins ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setDurationMinutes(mins)}
                  leftIcon={<Clock className="h-3.5 w-3.5" />}
                >
                  {mins} minutes
                </Button>
              ))}
            </div>
          </div>

          {/* Difficulty & Interview Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Difficulty level"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")
              }
              options={[
                { value: "EASY", label: "Easy · Foundational concepts" },
                { value: "MEDIUM", label: "Medium · Production trade-offs" },
                {
                  value: "HARD",
                  label: "Hard · Deep architecture & edge cases",
                },
              ]}
            />

            <Select
              label="Interview format"
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              options={[
                { value: "TECHNICAL", label: "Technical deep-dive" },
                {
                  value: "SYSTEM_DESIGN",
                  label: "System design & architecture",
                },
                {
                  value: "BEHAVIORAL",
                  label: "Behavioral & project ownership",
                },
                { value: "MIXED", label: "Mixed technical + behavioral" },
              ]}
            />
          </div>

          {/* Focus Skills Selection */}
          <div className="space-y-2.5 border-t border-border pt-4">
            <p className="text-xs font-medium text-content-heading">
              Focus skills to assess ({selectedFocusSkills.length} selected)
            </p>
            <div className="flex flex-wrap gap-2">
              {activeQueue.map((gap) => {
                const isSelected = selectedFocusSkills.includes(gap.skill);
                return (
                  <Button
                    key={gap.skill}
                    variant={isSelected ? "primary" : "outline"}
                    size="sm"
                    onClick={() => toggleFocusSkillInModal(gap.skill)}
                  >
                    {gap.skill} ({gap.priority})
                  </Button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-end">
              <Input
                label="Add a custom skill to test"
                placeholder="e.g., Redis, System Design, OAuth2"
                value={customFocusSkill}
                onChange={(e) => setCustomFocusSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomFocusSkill();
                  }
                }}
              />
              <Button
                variant="secondary"
                onClick={handleAddCustomFocusSkill}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add skill
              </Button>
            </div>
          </div>

          <ProgressBar
            label={`Estimated question count: ${Math.max(3, Math.round(durationMinutes / 5))} rubric-scored questions`}
            value={Math.min(100, (durationMinutes / 60) * 100)}
            showValue={false}
          />
        </div>
      </Modal>
    </ContentContainer>
  );
};

export default SkillGapPage;
