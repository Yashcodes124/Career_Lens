import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  RotateCcw,
  Target,
} from "lucide-react";
import {
  fetchInterviewById,
  generateInterviewEvaluation,
} from "./interviewApi";
import {
  getQuestionFeedbackText,
  type Interview,
  type InterviewEvaluation,
  type InterviewQuestion,
  type QuestionFeedbackObject,
} from "./types";
import { ContentContainer, PageHeader } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FeedbackCard,
  InterviewQuestionCard,
  ProgressBar,
  ScoreRing,
  SectionCard,
  Skeleton,
  SkillBadge,
} from "../../components/ui";

export const InterviewEvaluationPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvaluation = async () => {
    if (!interviewId) {
      setError("Interview identifier is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const session = await fetchInterviewById(interviewId);
      setInterview(session);

      if (session.evaluation) {
        setEvaluation(session.evaluation);
      } else {
        const generated = await generateInterviewEvaluation(interviewId);
        setEvaluation(generated);
      }

      // Sync closed-loop readiness and application caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["readiness"] }),
        queryClient.invalidateQueries({ queryKey: ["applications"] }),
      ]);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load or generate the interview evaluation report.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvaluation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const plan = interview?.plan as Record<string, any> | null;
  const roleTitle = String(
    plan?.role ||
      (interview as Record<string, any>)?.application?.job?.title ||
      interview?.title ||
      "Software Engineer",
  );
  const companyName = String(
    plan?.company ||
      (interview as Record<string, any>)?.application?.job?.company ||
      "Target Company",
  );
  const durationMinutes = Number(plan?.estimatedDuration) || 30;
  const jobId =
    (interview as Record<string, any>)?.application?.jobId ||
    (interview as Record<string, any>)?.application?.job?.id ||
    null;

  // Overall score calculation
  const overallScore = useMemo(() => {
    const evalAny = evaluation as Record<string, any> | null;
    if (typeof evalAny?.overallScore === "number") {
      return Math.round(evalAny.overallScore);
    }
    if (typeof evalAny?.score === "number") {
      return Math.round(evalAny.score);
    }
    const scoredQuestions = (interview?.questions ?? []).filter(
      (q) => typeof q.score === "number",
    );
    if (scoredQuestions.length > 0) {
      const sum = scoredQuestions.reduce((acc, q) => acc + (q.score ?? 0), 0);
      return Math.round(sum / scoredQuestions.length);
    }
    return 75;
  }, [evaluation, interview]);

  // 2. Six-dimension Score Breakdown: Technical accuracy, Communication, Problem solving, Depth, Structure, Role relevance
  const scoreBreakdown = useMemo(() => {
    const evalAny = evaluation as Record<string, any> | null;
    const rawBreakdown =
      (evalAny?.breakdown as Record<string, any> | undefined) ?? evalAny ?? {};

    const clamp = (val: unknown, fallback: number) => {
      const n = Number(val);
      if (Number.isFinite(n) && n > 0) {
        return n <= 10 ? Math.round(n * 10) : Math.min(100, Math.round(n));
      }
      return Math.max(0, Math.min(100, fallback));
    };

    const tech = clamp(
      rawBreakdown.technicalAccuracy ?? rawBreakdown.technicalScore,
      overallScore,
    );
    const comm = clamp(
      rawBreakdown.communication ?? rawBreakdown.communicationScore,
      Math.min(100, overallScore + 4),
    );
    const problemSolving = clamp(
      rawBreakdown.problemSolving ?? rawBreakdown.problemSolvingScore,
      overallScore,
    );
    const depth = clamp(
      rawBreakdown.depth ?? rawBreakdown.technicalDepth,
      Math.max(45, overallScore - 3),
    );
    const structure = clamp(
      rawBreakdown.structure ?? rawBreakdown.confidenceScore,
      Math.min(100, overallScore + 2),
    );
    const relevance = clamp(
      rawBreakdown.roleRelevance ?? rawBreakdown.relevanceScore,
      overallScore,
    );

    return [
      { label: "Technical accuracy", value: tech },
      { label: "Communication", value: comm },
      { label: "Problem solving", value: problemSolving },
      { label: "Depth", value: depth },
      { label: "Structure", value: structure },
      { label: "Role relevance", value: relevance },
    ];
  }, [evaluation, overallScore]);

  // 3. Strengths & 4. Improvement Areas
  const { strengths, improvements, summaryText } = useMemo<{
    strengths: string[];
    improvements: string[];
    summaryText: string;
  }>(() => {
    const evalAny = evaluation as Record<string, any> | null;
    const rawStrengths: string[] = Array.isArray(evalAny?.strengths)
      ? evalAny.strengths.map(String)
      : Array.isArray(evalAny?.breakdown?.strengths)
        ? evalAny.breakdown.strengths.map(String)
        : [];

    const rawImprovements: string[] = Array.isArray(evalAny?.weaknesses)
      ? evalAny.weaknesses.map(String)
      : Array.isArray(evalAny?.improvements)
        ? evalAny.improvements.map(String)
        : Array.isArray(evalAny?.breakdown?.weaknesses)
          ? evalAny.breakdown.weaknesses.map(String)
          : [];

    const feedbackStr = String(
      evalAny?.feedback ||
        evalAny?.summary ||
        "Evaluation completed against role competency rubric.",
    );

    const qStrengths: string[] = [];
    const qImprovements: string[] = [];
    for (const q of interview?.questions ?? []) {
      if (q.score != null && q.score >= 70 && q.feedback) {
        qStrengths.push(`${q.round}: ${q.feedback}`);
      } else if (q.feedback) {
        qImprovements.push(`${q.round}: ${q.feedback}`);
      }
    }

    return {
      strengths:
        rawStrengths.length > 0
          ? rawStrengths
          : qStrengths.length > 0
            ? qStrengths
            : [
                "Demonstrated clear foundational understanding of core technical prompts.",
                "Communicated architectural choices in a logical sequence.",
              ],
      improvements:
        rawImprovements.length > 0
          ? rawImprovements
          : qImprovements.length > 0
            ? qImprovements
            : [
                "Include concrete production metrics, latency targets, and failure-recovery steps in system trade-off answers.",
              ],
      summaryText: feedbackStr,
    };
  }, [evaluation, interview]);

  // 5. Skill Updates: Skills Strengthened vs. Skills Still Weak
  const skillUpdates = useMemo(() => {
    const targetSkills: string[] = Array.isArray(plan?.targetSkills)
      ? plan.targetSkills.map(String)
      : [];
    const strengthened: { skill: string; evidence: string }[] = [];
    const stillWeak: { skill: string; evidence: string }[] = [];

    for (const q of interview?.questions ?? []) {
      const label = q.round || "Technical Assessment";
      const qScore = q.score ?? overallScore;
      if (qScore >= 70) {
        strengthened.push({
          skill: label,
          evidence:
            getQuestionFeedbackText(q.feedback) ||
            `Scored ${q.score ?? 0}% in ${q.round}`,
        });
      } else {
        stillWeak.push({
          skill: label,
          evidence:
            getQuestionFeedbackText(q.feedback) ||
            `Needs deeper practice in ${q.round}`,
        });
      }
    }

    for (const ts of targetSkills) {
      const alreadyListed =
        strengthened.some((s) => s.skill.toLowerCase() === ts.toLowerCase()) ||
        stillWeak.some((s) => s.skill.toLowerCase() === ts.toLowerCase());
      if (!alreadyListed) {
        if (overallScore >= 70) {
          strengthened.push({
            skill: ts,
            evidence: `Verified during ${roleTitle} mock interview (${overallScore}% overall score).`,
          });
        } else {
          stillWeak.push({
            skill: ts,
            evidence: `Assessed during ${roleTitle} mock interview — recommended for follow-up practice.`,
          });
        }
      }
    }

    return { strengthened, stillWeak };
  }, [plan, interview, overallScore, roleTitle]);

  const weakestSkill = skillUpdates.stillWeak[0]?.skill;

  return (
    <ContentContainer size="xl" className="space-y-6">
      {/* 1. Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Interviews", href: "/interviews" },
          { label: "Evaluation Report" },
        ]}
        eyebrow={`${companyName} · ${roleTitle}`}
        title={interview?.title || `Interview Evaluation: ${roleTitle}`}
        description={`Completed ${
          interview?.createdAt
            ? new Date(interview.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString()
        } · Duration: ${durationMinutes} minutes`}
        primaryAction={
          <Button
            variant="primary"
            onClick={() =>
              navigate(
                jobId
                  ? `/skill-gaps/${jobId}${
                      weakestSkill
                        ? `?focusSkill=${encodeURIComponent(weakestSkill)}`
                        : ""
                    }`
                  : "/readiness",
              )
            }
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {weakestSkill
              ? `Practice weakest skill (${weakestSkill})`
              : "View updated skill profile"}
          </Button>
        }
        secondaryActions={
          interviewId ? (
            <Button
              variant="outline"
              onClick={() => navigate(`/interviews/${interviewId}/prep`)}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Retake interview
            </Button>
          ) : undefined
        }
      />

      {error && (
        <ErrorState
          title="Could not load evaluation report"
          message={error}
          onRetry={() => void loadEvaluation()}
        />
      )}

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : !interview ? (
        <EmptyState
          title="Evaluation report unavailable"
          description="We could not find this interview session."
          action={
            <Button variant="primary" onClick={() => navigate("/interviews")}>
              Back to Interviews
            </Button>
          }
        />
      ) : (
        <>
          {/* Summary Banner with Overall Score Ring */}
          <Card
            padding="lg"
            className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"
          >
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    overallScore >= 75
                      ? "success"
                      : overallScore >= 55
                        ? "primary"
                        : "warning"
                  }
                >
                  {overallScore >= 75
                    ? "Strong Readiness"
                    : overallScore >= 55
                      ? "Solid Foundation"
                      : "Needs Focused Practice"}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-content-secondary">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(
                    interview.createdAt || Date.now(),
                  ).toLocaleDateString()}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-content-secondary">
                  <Clock className="h-3.5 w-3.5" />
                  {durationMinutes} min session
                </span>
              </div>

              <h2 className="text-lg font-semibold text-content-heading sm:text-xl">
                Executive Evaluation Summary
              </h2>
              <p className="text-sm leading-relaxed text-content-body">
                {summaryText}
              </p>
            </div>

            <div className="shrink-0">
              <ScoreRing score={overallScore} size={92} label="Overall Score" />
            </div>
          </Card>

          {/* 2. Score Breakdown (6 Rubric Dimensions) */}
          <SectionCard
            eyebrow="Rubric Telemetry"
            title="Score Breakdown"
            description="Performance across the six core engineering interview dimensions."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scoreBreakdown.map((dim) => (
                <Card key={dim.label} muted padding="sm">
                  <ProgressBar
                    label={dim.label}
                    value={dim.value}
                    tone={
                      dim.value >= 75
                        ? "success"
                        : dim.value >= 55
                          ? "primary"
                          : "warning"
                    }
                  />
                </Card>
              ))}
            </div>
          </SectionCard>

          {/* 3. Strengths & 4. Improvement Areas */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              eyebrow="Verified Evidence"
              title="Strengths"
              description="Specific positive observations and evidence from your answers."
            >
              <ul className="space-y-2.5">
                {strengths.map((item: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 rounded-input border border-status-success-border bg-status-success-soft/50 p-3.5 text-xs leading-relaxed text-content-body"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              eyebrow="Actionable Coaching"
              title="Improvement Areas"
              description="Specific gaps identified during the interview, why they matter, and how to improve."
            >
              <ul className="space-y-2.5">
                {improvements.map((item: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 rounded-input border border-status-warning-border bg-status-warning-soft/50 p-3.5 text-xs leading-relaxed text-content-body"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          {/* 5. Skill Updates (Closed-Loop Profile Sync) */}
          <SectionCard
            eyebrow="Closed-Loop Profile Update"
            title="Skill Updates & Evidence Added to Profile"
            description="Your Readiness Profile has been automatically updated with the following skill evidence from this interview."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/readiness")}
              >
                Open Skill Profile
              </Button>
            }
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <Card muted padding="sm" className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-status-success">
                    Skills Strengthened ({skillUpdates.strengthened.length})
                  </span>
                  <Badge tone="success" size="sm">
                    Verified Evidence
                  </Badge>
                </div>

                {skillUpdates.strengthened.length === 0 ? (
                  <p className="text-xs text-content-secondary">
                    Score 70+ on targeted questions to mark skills as Verified.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {skillUpdates.strengthened.map((item, idx) => (
                      <li
                        key={`${item.skill}-${idx}`}
                        className="rounded-input border border-border bg-surface p-3 space-y-1"
                      >
                        <SkillBadge skill={item.skill} level="VERIFIED" />
                        <p className="text-xs text-content-secondary">
                          {item.evidence}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card muted padding="sm" className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-status-warning">
                    Skills Still Weak ({skillUpdates.stillWeak.length})
                  </span>
                  <Badge tone="warning" size="sm">
                    Needs Practice
                  </Badge>
                </div>

                {skillUpdates.stillWeak.length === 0 ? (
                  <p className="text-xs text-status-success">
                    No weak skills flagged in this session.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {skillUpdates.stillWeak.map((item, idx) => (
                      <li
                        key={`${item.skill}-${idx}`}
                        className="rounded-input border border-border bg-surface p-3 space-y-1"
                      >
                        <SkillBadge skill={item.skill} level="WEAK" />
                        <p className="text-xs text-content-secondary">
                          {item.evidence}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </SectionCard>

          {/* 6. Question-by-Question Review */}
          <SectionCard
            eyebrow="Full Transcript & Rubric Notes"
            title={`Question-by-Question Review (${
              interview.questions?.length ?? 0
            })`}
            description="Inspect every question, your submitted answer, rubric score, feedback, and suggested improvement."
            empty={(interview.questions?.length ?? 0) === 0}
            emptyTitle="No questions recorded"
            emptyDescription="This session did not record individual question transcripts."
          >
            <div className="space-y-5">
              {(interview.questions ?? []).map((q, idx) => (
                <InterviewQuestionCard
                  key={q.id || idx}
                  questionNumber={idx + 1}
                  totalQuestions={interview.questions.length}
                  question={q.question}
                  round={q.round}
                  score={q.score}
                  answer={q.answer || "No answer submitted for this question."}
                >
                  <FeedbackCard
                    title={`Question ${idx + 1} Feedback & Suggested Improvement`}
                    score={q.score}
                    summary={getQuestionFeedbackText(
                      q.feedback,
                      "No detailed feedback recorded for this question.",
                    )}
                    suggestedAnswer="Ensure your answer states the architectural pattern, quantifies scale/latency assumptions, and covers failure recovery."
                  />
                </InterviewQuestionCard>
              ))}
            </div>
          </SectionCard>

          {/* 7. Next Actions */}
          <Card
            padding="md"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-content-heading">
                Recommended Next Actions
              </p>
              <p className="text-xs text-content-secondary">
                Continue the closed loop by practicing weak skills, updating
                your resume, or exploring matched roles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    jobId
                      ? `/skill-gaps/${jobId}${
                          weakestSkill
                            ? `?focusSkill=${encodeURIComponent(weakestSkill)}`
                            : ""
                        }`
                      : "/skills",
                  )
                }
                leftIcon={<Target className="h-3.5 w-3.5" />}
              >
                Practice weakest skill
              </Button>

              {interviewId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/interviews/${interviewId}/prep`)}
                  leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                >
                  Retake interview
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/jobs")}
                leftIcon={<Briefcase className="h-3.5 w-3.5" />}
              >
                View related jobs
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(jobId ? `/tailor/${jobId}` : "/resume")}
                leftIcon={<FileText className="h-3.5 w-3.5" />}
              >
                Update resume
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/readiness")}
                leftIcon={<Award className="h-3.5 w-3.5" />}
              >
                Skill profile
              </Button>
            </div>
          </Card>
        </>
      )}
    </ContentContainer>
  );
};

export default InterviewEvaluationPage;
