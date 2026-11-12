import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquare,
  Play,
  Plus,
  RotateCcw,
  Sliders,
} from "lucide-react";
import {
  createInterview,
  fetchUserInterviews,
  INTERVIEW_ROUND_CATALOG,
} from "./interviewApi";
import type { Interview } from "./types";
import { useApplications } from "../tracker/useApplications";
import { useResumes } from "../resume/useResumes";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  ScoreRing,
  SectionCard,
  Select,
  Skeleton,
  Tabs,
} from "../../components/ui";

export const InterviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: applications } = useApplications();
  const { data: resumes } = useResumes();
  const activeResume = resumes?.[0] ?? null;

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Custom Mock Interview Builder State
  const [builderOpen, setBuilderOpen] = useState<boolean>(false);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "MEDIUM",
  );
  const [roundMode, setRoundMode] = useState<"ALL" | "SPECIFIC">("SPECIFIC");
  const [selectedRounds, setSelectedRounds] = useState<string[]>([
    "Project & Resume Deep-Dive",
    "Core Technical & Stack Assessment",
    "System Design & Architecture",
  ]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUserInterviews();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your mock interview sessions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInterviews();
  }, []);

  useEffect(() => {
    if (applications && applications.length > 0 && !selectedAppId) {
      setSelectedAppId(applications[0].id);
      const defaultGaps = applications[0].skillGaps?.slice(0, 3) ?? [];
      setSelectedSkills(
        defaultGaps.length > 0
          ? defaultGaps
          : (activeResume?.skills ?? []).slice(0, 3),
      );
    }
  }, [applications, selectedAppId, activeResume]);

  const selectedApplication = useMemo(
    () => (applications ?? []).find((a) => a.id === selectedAppId) ?? null,
    [applications, selectedAppId],
  );

  const availableSkillsForBuilder = useMemo(() => {
    const set = new Set<string>(selectedSkills);
    for (const gap of selectedApplication?.skillGaps ?? []) set.add(gap);
    for (const s of (activeResume?.skills ?? []).slice(0, 12)) set.add(s);
    return [...set];
  }, [selectedSkills, selectedApplication, activeResume]);

  const inProgress = useMemo(
    () => interviews.filter((i) => i.status === "IN_PROGRESS"),
    [interviews],
  );
  const scheduled = useMemo(
    () => interviews.filter((i) => i.status === "SCHEDULED"),
    [interviews],
  );
  const completed = useMemo(
    () => interviews.filter((i) => i.status === "COMPLETED"),
    [interviews],
  );

  const averageScore = useMemo(() => {
    const scores = completed
      .map((i) => {
        const evalAny = i.evaluation as Record<string, any> | null;
        return typeof evalAny?.overallScore === "number"
          ? evalAny.overallScore
          : typeof evalAny?.score === "number"
            ? evalAny.score
            : null;
      })
      .filter((n): n is number => n !== null);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [completed]);

  const visibleInterviews = useMemo(() => {
    if (activeTab === "in_progress") return inProgress;
    if (activeTab === "scheduled") return scheduled;
    if (activeTab === "completed") return completed;
    return interviews;
  }, [activeTab, interviews, inProgress, scheduled, completed]);

  const toggleRound = (roundName: string) => {
    setSelectedRounds((prev) =>
      prev.includes(roundName)
        ? prev.filter((r) => r !== roundName)
        : [...prev, roundName],
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    if (!selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkill("");
  };

  const handleCreateCustomInterview = async () => {
    if (!selectedAppId) {
      setCreateError(
        "Select a tracked job application first (or match a resume to a job on Explore Jobs).",
      );
      return;
    }

    setCreateError(null);
    setIsCreating(true);
    try {
      const roundsToUse =
        roundMode === "ALL"
          ? INTERVIEW_ROUND_CATALOG.slice(0, durationMinutes <= 15 ? 3 : 5).map(
              (r) => r.name,
            )
          : selectedRounds.length > 0
            ? selectedRounds
            : ["Core Technical & Stack Assessment"];

      const created = await createInterview({
        applicationId: selectedAppId,
        durationMinutes,
        difficulty,
        focusTopics:
          selectedSkills.length > 0 ? selectedSkills : ["Core Engineering"],
        selectedRounds: roundsToUse,
      });

      navigate(`/interviews/${created.id}/prep`);
    } catch (err: unknown) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Could not create custom interview session.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const renderInterviewCard = (session: Interview) => {
    const plan = session.plan as Record<string, any> | null;
    const roleTitle = String(
      plan?.role ||
        (session as Record<string, any>)?.application?.job?.title ||
        session.title ||
        "Software Engineer",
    );
    const companyName = String(
      plan?.company ||
        (session as Record<string, any>)?.application?.job?.company ||
        "Target Company",
    );
    const sessionDuration = Number(plan?.estimatedDuration) || 30;
    const sessionDifficulty = String(
      plan?.difficulty || "MEDIUM",
    ).toUpperCase();
    const roundsList: { name: string; duration: number }[] = Array.isArray(
      plan?.rounds,
    )
      ? plan.rounds
      : [];
    const targetSkills: string[] = Array.isArray(plan?.targetSkills)
      ? plan.targetSkills.map(String)
      : [];

    const totalQuestions = session.questions?.length ?? 0;
    const answeredQuestions = (session.questions ?? []).filter(
      (q) => q.answer && q.answer.trim().length > 0,
    ).length;

    const evalAny = session.evaluation as Record<string, any> | null;
    const overallScore =
      typeof evalAny?.overallScore === "number"
        ? Math.round(evalAny.overallScore)
        : typeof evalAny?.score === "number"
          ? Math.round(evalAny.score)
          : null;

    return (
      <Card
        key={session.id}
        padding="md"
        className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"
      >
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                session.status === "COMPLETED"
                  ? "success"
                  : session.status === "IN_PROGRESS"
                    ? "warning"
                    : "primary"
              }
              size="sm"
            >
              {session.status === "IN_PROGRESS"
                ? "In Progress"
                : session.status === "COMPLETED"
                  ? "Completed"
                  : "Ready to Start"}
            </Badge>
            <Badge tone="neutral" size="sm">
              {companyName}
            </Badge>
            <Badge tone="neutral" size="sm">
              {sessionDifficulty} · {sessionDuration}m
            </Badge>
          </div>

          <h3 className="text-base font-semibold text-content-heading">
            {roleTitle}
          </h3>

          {/* Rounds & Focus Skills Pills */}
          {roundsList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-medium text-content-secondary">
                Rounds:
              </span>
              {roundsList.map((r, idx) => (
                <Badge key={`${r.name}-${idx}`} tone="neutral" size="sm">
                  {r.name} ({r.duration}m)
                </Badge>
              ))}
            </div>
          )}

          {targetSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-medium text-content-secondary">
                Skills:
              </span>
              {targetSkills.slice(0, 5).map((s) => (
                <Badge key={s} tone="primary" size="sm">
                  {s}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-content-secondary tabular-nums pt-0.5">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(session.createdAt).toLocaleDateString()}
            </span>
            {totalQuestions > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {answeredQuestions} of {totalQuestions} questions answered
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {session.status === "COMPLETED" && overallScore !== null && (
            <ScoreRing score={overallScore} size={56} />
          )}

          {session.status === "IN_PROGRESS" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/interviews/${session.id}/live`)}
              leftIcon={<Play className="h-3.5 w-3.5" />}
            >
              Resume session
            </Button>
          ) : session.status === "SCHEDULED" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/interviews/${session.id}/prep`)}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Prepare & start
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/interviews/${session.id}/prep`)}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                Retake
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/interviews/${session.id}/evaluation`)}
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              >
                View evaluation
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <ContentContainer size="xl" className="space-y-6">
      <PageHeader
        eyebrow="Mock Interview Command Center"
        title="Interviews"
        description="Configure custom mock interviews by choosing specific rounds and skills, resume unfinished sessions, or inspect rubric evaluations."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => setBuilderOpen((prev) => !prev)}
            leftIcon={<Sliders className="h-4 w-4" />}
          >
            {builderOpen
              ? "Hide custom interview builder"
              : "Configure custom interview"}
          </Button>
        }
        secondaryActions={
          <Button variant="outline" onClick={() => navigate("/readiness")}>
            View skill profile
          </Button>
        }
      />

      {/* 1. Interview Telemetry Summary */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-content-secondary">
              Total Sessions
            </span>
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold text-content-heading tabular-nums">
            {interviews.length}
          </p>
          <p className="text-xs text-content-secondary">
            {inProgress.length} in progress · {scheduled.length} ready to start
          </p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-content-secondary">
              Completed Evaluations
            </span>
            <CheckCircle2 className="h-4 w-4 text-status-success" />
          </div>
          <p className="text-2xl font-semibold text-status-success tabular-nums">
            {completed.length}
          </p>
          <p className="text-xs text-content-secondary">
            Rubric-graded sessions synced to your skill profile
          </p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-content-secondary">
              Average Rubric Score
            </span>
            <Award className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold text-primary tabular-nums">
            {averageScore !== null ? `${averageScore}%` : "N/A"}
          </p>
          <p className="text-xs text-content-secondary">
            Across completed technical & behavioral sessions
          </p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-content-secondary">
              Available Round Types
            </span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold text-content-heading tabular-nums">
            {INTERVIEW_ROUND_CATALOG.length}
          </p>
          <p className="text-xs text-content-secondary">
            Take all rounds or pick specific ones below
          </p>
        </Card>
      </section>

      {/* 2. Custom Interview Builder (User-Specific Rounds & Skills) */}
      {(builderOpen || interviews.length === 0) && (
        <SectionCard
          eyebrow="Custom Session Designer"
          title="Build a Custom Mock Interview"
          description="Choose a target role, pick whether to take all interview rounds or only specific rounds (Intro, Project Deep-Dive, Technical, System Design, Debugging, DSA, Behavioral), and select the exact skills to test."
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-content-secondary">
                {roundMode === "ALL"
                  ? `Full mock interview · ${durationMinutes} minutes · ${difficulty}`
                  : `${selectedRounds.length} custom ${
                      selectedRounds.length === 1 ? "round" : "rounds"
                    } selected · ${durationMinutes} minutes · ${difficulty}`}
              </span>
              <Button
                variant="primary"
                loading={isCreating}
                onClick={() => void handleCreateCustomInterview()}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Create & open preparation
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            {createError && (
              <ErrorState
                title="Could not create custom interview"
                message={createError}
              />
            )}

            {/* Target Role, Duration & Difficulty */}
            <div className="grid gap-4 lg:grid-cols-3">
              {(applications ?? []).length > 0 ? (
                <Select
                  label="1. Target role / application"
                  value={selectedAppId}
                  options={(applications ?? []).map((app) => ({
                    value: app.id,
                    label: `${app.job.title} at ${app.job.company}`,
                  }))}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedAppId(nextId);
                    const found = (applications ?? []).find(
                      (a) => a.id === nextId,
                    );
                    if (found?.skillGaps?.length) {
                      setSelectedSkills(found.skillGaps.slice(0, 3));
                    }
                  }}
                />
              ) : (
                <Card
                  muted
                  padding="sm"
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-content-secondary">
                    Match a job first to unlock role-specific context.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/jobs")}
                  >
                    Explore jobs
                  </Button>
                </Card>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-content-heading">
                  2. Session duration
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[15, 30, 45, 60].map((mins) => (
                    <Button
                      key={mins}
                      variant={durationMinutes === mins ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setDurationMinutes(mins)}
                    >
                      {mins}m
                    </Button>
                  ))}
                </div>
              </div>

              <Select
                label="3. Difficulty level"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")
                }
                options={[
                  { value: "EASY", label: "Easy · Core fundamentals" },
                  { value: "MEDIUM", label: "Medium · Production trade-offs" },
                  {
                    value: "HARD",
                    label: "Hard · Architecture & edge cases",
                  },
                ]}
              />
            </div>

            {/* 4. Select All Rounds vs. Specific Rounds */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-content-heading">
                    4. Choose Interview Rounds
                  </p>
                  <p className="text-xs text-content-secondary">
                    Take a complete end-to-end mock interview or focus only on
                    specific rounds you want to practice.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={roundMode === "ALL" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setRoundMode("ALL")}
                  >
                    All Rounds (Full Mock)
                  </Button>
                  <Button
                    variant={roundMode === "SPECIFIC" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setRoundMode("SPECIFIC")}
                  >
                    Specific Rounds ({selectedRounds.length})
                  </Button>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {INTERVIEW_ROUND_CATALOG.map((round) => {
                  const active =
                    roundMode === "ALL" || selectedRounds.includes(round.name);
                  return (
                    <Card
                      key={round.id}
                      padding="sm"
                      interactive
                      onClick={() => {
                        if (roundMode === "ALL") {
                          setRoundMode("SPECIFIC");
                          setSelectedRounds([round.name]);
                        } else {
                          toggleRound(round.name);
                        }
                      }}
                      className={`cursor-pointer space-y-1.5 ${
                        active ? "border-primary bg-primary-soft/30" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-content-heading">
                          {round.shortLabel}
                        </span>
                        <Badge tone={active ? "primary" : "neutral"} size="sm">
                          {active ? "Included" : "Off"}
                        </Badge>
                      </div>
                      <p className="text-[11px] leading-relaxed text-content-secondary">
                        {round.description}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 5. Focus Skills Selector */}
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold text-content-heading">
                5. Skills & Topics to Test ({selectedSkills.length} selected)
              </p>

              <div className="flex flex-wrap gap-1.5">
                {availableSkillsForBuilder.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <Button
                      key={skill}
                      variant={isSelected ? "primary" : "outline"}
                      size="sm"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </Button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Input
                  label="Add any custom topic or technology"
                  placeholder="e.g., JWT Auth, Microservices, PostgreSQL Indexing"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={handleAddCustomSkill}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add topic
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {error && (
        <ErrorState
          title="Could not load interviews"
          message={error}
          onRetry={() => void loadInterviews()}
        />
      )}

      {/* 3. All Interview Sessions Ledger */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          title="No mock interviews yet"
          description="Use the Custom Mock Interview Builder above or select a matched job to launch your first session."
          icon={<MessageSquare className="h-5 w-5" />}
        />
      ) : (
        <SectionCard
          eyebrow="Session Ledger"
          title={`All Interview Sessions (${interviews.length})`}
          description="Organized by active progress, scheduled preparation, and completed rubric evaluations."
        >
          <div className="space-y-4">
            <Tabs
              activeTab={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  id: "all",
                  label: "All Sessions",
                  count: interviews.length,
                },
                {
                  id: "in_progress",
                  label: "Left-Off / In Progress",
                  count: inProgress.length,
                },
                {
                  id: "scheduled",
                  label: "Ready to Start",
                  count: scheduled.length,
                },
                {
                  id: "completed",
                  label: "Completed & Evaluated",
                  count: completed.length,
                },
              ]}
            />

            {visibleInterviews.length === 0 ? (
              <EmptyState
                title="No sessions in this tab"
                description="Switch tabs above or configure a custom mock interview."
              />
            ) : (
              <div className="space-y-3">
                {visibleInterviews.map(renderInterviewCard)}
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </ContentContainer>
  );
};

export default InterviewsPage;
