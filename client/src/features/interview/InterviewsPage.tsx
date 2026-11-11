import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Play,
  RotateCcw,
} from "lucide-react";
import { fetchUserInterviews } from "./interviewApi";
import type { Interview } from "./types";
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

export const InterviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

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

  const visibleInterviews = useMemo(() => {
    if (activeTab === "in_progress") return inProgress;
    if (activeTab === "scheduled") return scheduled;
    if (activeTab === "completed") return completed;
    return interviews;
  }, [activeTab, interviews, inProgress, scheduled, completed]);

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
    const durationMinutes = Number(plan?.estimatedDuration) || 30;
    const difficulty = String(plan?.difficulty || "MEDIUM").toUpperCase();
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
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div className="space-y-1.5 min-w-0">
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
              {difficulty} · {durationMinutes}m
            </Badge>
          </div>

          <h3 className="text-base font-semibold text-content-heading truncate">
            {roleTitle}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-content-secondary tabular-nums">
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
        eyebrow="Mock Interview Workspace"
        title="Interviews"
        description="Resume unfinished sessions, start scheduled interviews, or inspect rubric evaluations from completed sessions."
        primaryAction={
          <Button
            variant="primary"
            onClick={() => navigate("/jobs")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Start new targeted interview
          </Button>
        }
        secondaryActions={
          <Button variant="outline" onClick={() => navigate("/readiness")}>
            View skill profile
          </Button>
        }
      />

      {error && (
        <ErrorState
          title="Could not load interviews"
          message={error}
          onRetry={() => void loadInterviews()}
        />
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          title="No mock interviews yet"
          description="Select a verified job posting and run a skill-gap analysis to launch your first targeted mock interview."
          icon={<MessageSquare className="h-5 w-5" />}
          action={
            <Button variant="primary" onClick={() => navigate("/jobs")}>
              Explore verified jobs
            </Button>
          }
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
                description="Switch tabs above or start a new targeted interview from any matched role."
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
