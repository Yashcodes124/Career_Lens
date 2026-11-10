import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  Play,
  Plus,
  ShieldCheck,
  Target,
} from "lucide-react";
import * as interviewApi from "./interviewApi";
import type { Interview } from "./types";
import { useResumes } from "../resume/useResumes";
import { useApplications } from "../tracker/useApplications";
import { apiClient } from "../../lib/api-client";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  Input,
  ProgressBar,
  ScoreRing,
  SectionCard,
  Select,
  Skeleton,
  SkillBadge,
  Toast,
} from "../../components/ui";

interface PrepLocationState {
  durationMinutes?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  focusSkills?: string[];
  focusTopics?: string[];
  roleTitle?: string;
  companyName?: string;
}

const DEFAULT_CHECKLIST = [
  {
    id: "requirements",
    label: "Review job requirements",
    description:
      "Confirm the core technical responsibilities and stack expectations for this role.",
  },
  {
    id: "gaps",
    label: "Review skill gaps",
    description:
      "Note the priority missing or weak skills that will be probed during the session.",
  },
  {
    id: "project",
    label: "Prepare project explanation",
    description:
      "Be ready to walk through one production architecture, your specific ownership, and measurable outcomes.",
  },
  {
    id: "tradeoffs",
    label: "Prepare trade-off examples",
    description:
      "Prepare concrete examples of latency, consistency, caching, or operational trade-offs you made.",
  },
];

export const InterviewPreparationPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as PrepLocationState | null) ?? {};

  const { data: resumes } = useResumes();
  const { data: applications } = useApplications();
  const activeResume = resumes?.[0] ?? null;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Configurable session controls (initialized from plan or location state)
  const [durationMinutes, setDurationMinutes] = useState<number>(
    navState.durationMinutes ?? 30,
  );
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    navState.difficulty ?? "MEDIUM",
  );
  const [interviewType, setInterviewType] = useState<string>("TECHNICAL");
  const [focusSkills, setFocusSkills] = useState<string[]>(
    navState.focusSkills ?? navState.focusTopics ?? [],
  );
  const [customSkillInput, setCustomSkillInput] = useState("");

  // Preparation checklist state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    requirements: true,
    gaps: true,
    project: false,
    tradeoffs: false,
  });

  const loadInterview = async () => {
    if (!interviewId) {
      setError("Interview session ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await interviewApi.fetchInterviewById(interviewId);
      setInterview(data);

      const plan = data.plan as Record<string, any> | null;
      if (plan?.estimatedDuration) {
        setDurationMinutes(Number(plan.estimatedDuration));
      }
      if (plan?.difficulty) {
        const normDiff = String(plan.difficulty).toUpperCase();
        if (
          normDiff === "EASY" ||
          normDiff === "MEDIUM" ||
          normDiff === "HARD"
        ) {
          setDifficulty(normDiff);
        }
      }
      if (
        Array.isArray(plan?.targetSkills) &&
        plan.targetSkills.length > 0 &&
        focusSkills.length === 0
      ) {
        setFocusSkills(plan.targetSkills.map(String));
      } else if (
        Array.isArray(plan?.focusSkills) &&
        plan.focusSkills.length > 0 &&
        focusSkills.length === 0
      ) {
        setFocusSkills(plan.focusSkills.map(String));
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load interview preparation details.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const linkedApp = useMemo(() => {
    if (!interview) return null;
    const appId = (interview as Record<string, any>).applicationId;
    return (applications ?? []).find((a) => a.id === appId) ?? null;
  }, [interview, applications]);

  const roleTitle = useMemo(() => {
    const plan = interview?.plan as Record<string, any> | null;
    return (
      plan?.role ||
      (interview as Record<string, any>)?.application?.job?.title ||
      linkedApp?.job.title ||
      navState.roleTitle ||
      interview?.title ||
      "Software Engineer"
    );
  }, [interview, linkedApp, navState.roleTitle]);

  const companyName = useMemo(() => {
    const plan = interview?.plan as Record<string, any> | null;
    return (
      plan?.company ||
      (interview as Record<string, any>)?.application?.job?.company ||
      linkedApp?.job.company ||
      navState.companyName ||
      "Target Company"
    );
  }, [interview, linkedApp, navState.companyName]);

  const matchScore = useMemo(() => {
    if (linkedApp?.matchScore != null) {
      return Math.round(linkedApp.matchScore);
    }
    const rawAppScore = (interview as Record<string, any>)?.application
      ?.matchScore;
    return rawAppScore != null ? Math.round(Number(rawAppScore)) : null;
  }, [linkedApp, interview]);

  // Planned rounds derived from interview.plan or interview.questions
  const plannedRounds = useMemo(() => {
    const plan = interview?.plan as Record<string, any> | null;
    if (Array.isArray(plan?.rounds) && plan.rounds.length > 0) {
      return plan.rounds.map((r: Record<string, any>, idx: number) => ({
        order: idx + 1,
        name: String(r.name || r.title || r.round || `Round ${idx + 1}`),
        duration: Number(
          r.durationMinutes ||
            r.duration ||
            Math.max(5, Math.round(durationMinutes / plan.rounds.length)),
        ),
        focus: String(
          r.focus ||
            r.description ||
            "Technical depth, production edge cases, and architectural clarity.",
        ),
        questionCount: Number(r.questionCount || 2),
      }));
    }

    const questions = interview?.questions ?? [];
    if (questions.length > 0) {
      const grouped = new Map<string, number>();
      for (const q of questions) {
        const roundName = q.round || "Technical Assessment";
        grouped.set(roundName, (grouped.get(roundName) ?? 0) + 1);
      }
      const entries = [...grouped.entries()];
      return entries.map(([name, count], idx) => ({
        order: idx + 1,
        name,
        duration: Math.max(5, Math.round(durationMinutes / entries.length)),
        focus: `Assesses ${
          focusSkills.slice(0, 3).join(", ") || "core role requirements"
        } through ${count} structured ${count === 1 ? "question" : "questions"}.`,
        questionCount: count,
      }));
    }

    return [
      {
        order: 1,
        name: "Core Technical & Skill Verification",
        duration: Math.round(durationMinutes * 0.6),
        focus: `Probes ${
          focusSkills.slice(0, 3).join(", ") || "priority role requirements"
        } and implementation trade-offs.`,
        questionCount: Math.max(2, Math.round(durationMinutes / 10)),
      },
      {
        order: 2,
        name: "Architecture, Debugging & Ownership",
        duration: Math.round(durationMinutes * 0.4),
        focus:
          "Evaluates system reliability, debugging under load, and past project decisions.",
        questionCount: Math.max(1, Math.round(durationMinutes / 15)),
      },
    ];
  }, [interview, durationMinutes, focusSkills]);

  const availableSkillsToToggle = useMemo(() => {
    const set = new Set<string>(focusSkills);
    for (const gap of linkedApp?.skillGaps ?? []) {
      if (gap) set.add(gap);
    }
    const plan = interview?.plan as Record<string, any> | null;
    for (const s of plan?.targetSkills ?? []) {
      if (s) set.add(String(s));
    }
    for (const s of (activeResume?.skills ?? []).slice(0, 6)) {
      if (s) set.add(s);
    }
    return [...set];
  }, [focusSkills, linkedApp, interview, activeResume]);

  const handleToggleFocusSkill = (skill: string) => {
    setFocusSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((item) => item !== skill)
        : [...prev, skill],
    );
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (!focusSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setFocusSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkillInput("");
  };

  const handleStartSession = async () => {
    if (!interviewId) return;
    setStarting(true);
    setError(null);

    try {
      const anyApi = interviewApi as Record<string, any>;
      if (typeof anyApi.startInterview === "function") {
        await anyApi.startInterview(interviewId);
      } else if (typeof anyApi.startInterviewSession === "function") {
        await anyApi.startInterviewSession(interviewId);
      } else {
        await apiClient
          .post(`/interviews/${interviewId}/start`, {
            durationMinutes,
            difficulty,
            interviewType,
            focusSkills,
          })
          .catch(() => null);
      }

      navigate(`/interviews/${interviewId}/live`, {
        state: {
          durationMinutes,
          difficulty,
          focusTopics: focusSkills,
          roleTitle,
          companyName,
        },
      });
    } catch (err: unknown) {
      setToastMessage(
        err instanceof Error
          ? err.message
          : "Proceeding to live interview session...",
      );
      navigate(`/interviews/${interviewId}/live`, {
        state: {
          durationMinutes,
          difficulty,
          focusTopics: focusSkills,
          roleTitle,
          companyName,
        },
      });
    } finally {
      setStarting(false);
    }
  };

  const completedChecklistCount =
    Object.values(checkedItems).filter(Boolean).length;

  return (
    <ContentContainer size="xl" className="space-y-6">
      {/* 1. Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Interviews", href: "/interviews" },
          { label: "Prepare for Interview" },
        ]}
        eyebrow={`${companyName} · ${roleTitle}`}
        title="Prepare for Interview"
        description={
          activeResume
            ? `Using resume: ${
                activeResume.fileName || activeResume.title
              } · Review your session parameters, planned rounds, and checklist before starting.`
            : "Configure your session parameters, review the planned rounds, and complete the preparation checklist."
        }
        primaryAction={
          interview?.status === "COMPLETED" ? (
            <Button
              variant="primary"
              onClick={() => navigate(`/interviews/${interviewId}/evaluation`)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              View evaluation report
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              loading={starting}
              disabled={loading || !interview}
              onClick={() => void handleStartSession()}
              leftIcon={<Play className="h-4 w-4" />}
            >
              {interview?.status === "IN_PROGRESS"
                ? "Continue interview"
                : "Start interview"}
            </Button>
          )
        }
        secondaryActions={
          <Button
            variant="outline"
            onClick={() => navigate("/interviews")}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            All interviews
          </Button>
        }
      />

      {toastMessage && (
        <Toast
          tone="neutral"
          title="Session update"
          description={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}

      {error && (
        <ErrorState
          title="Unable to load interview preparation"
          message={error}
          onRetry={() => void loadInterview()}
        />
      )}

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-5">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      ) : !interview ? (
        <EmptyState
          title="Interview session not found"
          description="This interview may have been removed or the link is invalid."
          action={
            <Button variant="primary" onClick={() => navigate("/interviews")}>
              Back to Interviews
            </Button>
          }
        />
      ) : (
        <>
          {/* Context Bar: Job, Company, Resume Used, Match Score */}
          <Card
            padding="md"
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary">{interview.status}</Badge>
                <Badge tone="neutral">{companyName}</Badge>
                <Badge tone="neutral">{durationMinutes} minutes</Badge>
                <Badge tone="neutral">{difficulty} difficulty</Badge>
              </div>
              <h2 className="text-base font-semibold text-content-heading sm:text-lg">
                {roleTitle} at {companyName}
              </h2>
              <p className="inline-flex items-center gap-1.5 text-xs text-content-secondary">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>
                  Resume used:{" "}
                  <strong className="font-medium text-content-heading">
                    {activeResume
                      ? activeResume.fileName || activeResume.title
                      : "Candidate Profile Baseline"}
                  </strong>
                </span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <ScoreRing score={matchScore} size={68} label="Role Match" />
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left 7 Columns: 2. Interview Configuration & 3. Planned Rounds Preview */}
            <div className="space-y-6 lg:col-span-7">
              <SectionCard
                eyebrow="Session Parameters"
                title="Interview Configuration"
                description="Calibrate duration, difficulty, interview format, and the specific skills you want assessed."
              >
                <div className="space-y-5">
                  {/* Duration: 15, 30, 45, 60 minutes */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-content-heading">
                      Duration
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[15, 30, 45, 60].map((mins) => (
                        <Button
                          key={mins}
                          variant={
                            durationMinutes === mins ? "primary" : "outline"
                          }
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
                      label="Difficulty"
                      value={difficulty}
                      onChange={(e) =>
                        setDifficulty(
                          e.target.value as "EASY" | "MEDIUM" | "HARD",
                        )
                      }
                      options={[
                        { value: "EASY", label: "Easy · Core fundamentals" },
                        {
                          value: "MEDIUM",
                          label: "Medium · Production trade-offs",
                        },
                        {
                          value: "HARD",
                          label: "Hard · Deep architecture & edge cases",
                        },
                      ]}
                    />

                    <Select
                      label="Interview type"
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      options={[
                        { value: "TECHNICAL", label: "Technical" },
                        { value: "BEHAVIORAL", label: "Behavioral" },
                        { value: "SYSTEM_DESIGN", label: "System design" },
                        { value: "MIXED", label: "Mixed" },
                      ]}
                    />
                  </div>

                  {/* Focus Skills: Selected Skill Gaps + Custom Skill Selection */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-content-heading">
                        Focus skills to assess ({focusSkills.length} selected)
                      </p>
                      <span className="text-xs text-content-secondary">
                        Click to toggle skills
                      </span>
                    </div>

                    {availableSkillsToToggle.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {availableSkillsToToggle.map((skill) => {
                          const isSelected = focusSkills.includes(skill);
                          return (
                            <Button
                              key={skill}
                              variant={isSelected ? "primary" : "outline"}
                              size="sm"
                              onClick={() => handleToggleFocusSkill(skill)}
                            >
                              {skill}
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-content-secondary">
                        Add custom skills below to focus your session.
                      </p>
                    )}

                    <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-end">
                      <Input
                        label="Add custom skill"
                        placeholder="e.g., Node.js Authentication, Redis, System Design"
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
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
                        Add skill
                      </Button>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* 3. Preview: Planned Rounds, Estimated Duration, Skills to Assess */}
              <SectionCard
                eyebrow="Session Preview"
                title={`Planned Rounds (${plannedRounds.length})`}
                description={`Estimated duration: ${durationMinutes} minutes · ${
                  interview.questions?.length ||
                  plannedRounds.reduce((acc, r) => acc + r.questionCount, 0)
                } structured questions`}
                action={
                  <Badge tone="primary" size="sm">
                    {difficulty} · {interviewType.replace("_", " ")}
                  </Badge>
                }
              >
                <div className="space-y-4">
                  <ul className="space-y-3">
                    {plannedRounds.map((round) => (
                      <li key={round.order}>
                        <Card muted padding="sm" className="space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge tone="primary" size="sm">
                                Round {round.order}
                              </Badge>
                              <h3 className="text-sm font-semibold text-content-heading">
                                {round.name}
                              </h3>
                            </div>
                            <span className="text-xs font-medium text-content-secondary tabular-nums">
                              ~{round.duration} min · {round.questionCount}{" "}
                              {round.questionCount === 1
                                ? "question"
                                : "questions"}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-content-body">
                            {round.focus}
                          </p>
                        </Card>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2 border-t border-border pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                      Skills to Assess in This Session
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {focusSkills.length > 0 ? (
                        focusSkills.map((skill) => (
                          <SkillBadge
                            key={skill}
                            skill={skill}
                            level="PRACTICED"
                            meta="Target Focus"
                          />
                        ))
                      ) : (
                        <span className="text-xs text-content-secondary">
                          General {roleTitle} technical & problem-solving
                          competencies
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Right 5 Columns: 5. Preparation Checklist & 4. Primary CTA Card */}
            <div className="space-y-6 lg:col-span-5">
              <SectionCard
                eyebrow="Pre-Session Readiness"
                title="Preparation Checklist"
                description="Complete these quick checks before starting your timed questions."
                action={
                  <Badge
                    tone={
                      completedChecklistCount === DEFAULT_CHECKLIST.length
                        ? "success"
                        : "neutral"
                    }
                    size="sm"
                  >
                    {completedChecklistCount}/{DEFAULT_CHECKLIST.length} ready
                  </Badge>
                }
              >
                <div className="space-y-4">
                  <ProgressBar
                    value={
                      (completedChecklistCount / DEFAULT_CHECKLIST.length) * 100
                    }
                    tone={
                      completedChecklistCount === DEFAULT_CHECKLIST.length
                        ? "success"
                        : "primary"
                    }
                    label="Checklist completion"
                  />

                  <div className="space-y-3 pt-1">
                    {DEFAULT_CHECKLIST.map((item) => (
                      <Card key={item.id} padding="sm">
                        <Checkbox
                          label={item.label}
                          description={item.description}
                          checked={Boolean(checkedItems[item.id])}
                          onChange={(e) =>
                            setCheckedItems((prev) => ({
                              ...prev,
                              [item.id]: e.target.checked,
                            }))
                          }
                        />
                      </Card>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Rubric & Launch Card */}
              <Card padding="md" className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input border border-border bg-primary-soft text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-content-heading">
                      How Your Answers Are Evaluated
                    </h3>
                    <p className="text-xs leading-relaxed text-content-secondary">
                      Each response is scored against a structured engineering
                      rubric (Technical Accuracy, Problem Solving,
                      Communication, Depth, and Role Relevance). Strong scores
                      automatically update your Skill Readiness Profile.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 border-t border-border pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-content-body">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>{plannedRounds.length} structured rounds</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-content-body">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    <span>Per-answer feedback</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-content-body">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Auto-saved local drafts</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-content-body">
                    <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                    <span>Resumable anytime</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={starting}
                  onClick={() => void handleStartSession()}
                  leftIcon={<Play className="h-4 w-4" />}
                >
                  {interview.status === "IN_PROGRESS"
                    ? "Continue interview"
                    : "Start interview"}
                </Button>
              </Card>
            </div>
          </div>
        </>
      )}
    </ContentContainer>
  );
};

export default InterviewPreparationPage;
