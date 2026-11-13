import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck2,
  RotateCcw,
  Send,
} from "lucide-react";
import {
  fetchInterviewById,
  generateInterviewEvaluation,
  submitInterviewAnswer,
} from "./interviewApi";
import {
  Interview,
  InterviewQuestion,
  QuestionFeedbackObject,
  parseQuestionFeedback,
} from "./types";
import { ContentContainer } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FeedbackCard,
  InterviewQuestionCard,
  ProgressBar,
  SectionCard,
  Skeleton,
  Textarea,
  Toast,
} from "../../components/ui";

interface LiveLocationState {
  durationMinutes?: number;
  difficulty?: string;
  focusTopics?: string[];
  roleTitle?: string;
  companyName?: string;
}

const DRAFT_STORAGE_PREFIX = "truehire_interview_draft_";

const formatElapsed = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const deriveQuestionFeedbackDetails = (
  feedbackInput: QuestionFeedbackObject | string | null | undefined,
  score: number | null | undefined,
) => {
  const parsedObj =
    typeof feedbackInput === "string"
      ? parseQuestionFeedback(feedbackInput)
      : feedbackInput;

  const raw = (parsedObj?.feedback || "").trim();
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const numericScore = score ?? 70;
  const strengths: string[] = Array.isArray(parsedObj?.strengths)
    ? parsedObj!.strengths.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const improvements: string[] = Array.isArray(parsedObj?.improvements)
    ? parsedObj!.improvements.map((s) => String(s).trim()).filter(Boolean)
    : [];

  if (strengths.length === 0 && improvements.length === 0) {
    for (const s of sentences) {
      if (
        /missing|improve|should|could|consider|lacked|expand|clarify|however|instead/i.test(
          s,
        )
      ) {
        improvements.push(s);
      } else {
        strengths.push(s);
      }
    }
  }

  if (strengths.length === 0 && numericScore >= 60) {
    strengths.push(
      raw ||
        "Addressed the core technical prompt with relevant engineering context.",
    );
  }
  if (improvements.length === 0) {
    improvements.push(
      "Quantify system constraints, failure recovery steps, and production trade-offs more explicitly.",
    );
  }

  return {
    summary:
      raw ||
      "Your response was recorded and scored against the role competency rubric.",
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    suggestedAnswer:
      "Structure: 1) State the architectural or implementation choice directly. 2) Explain the key trade-offs (latency, consistency, operational complexity). 3) Describe how you handle edge cases, monitoring, and failure modes in production.",
  };
};

export const LiveInterviewPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const navState = (location.state as LiveLocationState | null) ?? {};

  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answerText, setAnswerText] = useState<string>("");
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [isRedoing, setIsRedoing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadSession = async () => {
    if (!interviewId) {
      setError("Interview ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchInterviewById(interviewId);
      setInterview(data);

      const questions = data.questions ?? [];
      const firstUnansweredIdx = questions.findIndex(
        (q) => !q.answer || q.answer.trim() === "",
      );
      const initialIdx =
        firstUnansweredIdx >= 0
          ? firstUnansweredIdx
          : Math.max(0, questions.length - 1);
      setCurrentIndex(initialIdx);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load live interview session.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  // Live session timer
  useEffect(() => {
    if (loading || !interview) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loading, interview]);

  const questions: InterviewQuestion[] = useMemo(
    () => interview?.questions ?? [],
    [interview],
  );

  const currentQuestion: InterviewQuestion | null =
    questions[currentIndex] ?? null;

  // Load saved draft or existing answer when switching questions
  useEffect(() => {
    if (!currentQuestion || !interviewId) return;
    setIsRedoing(false);

    if (currentQuestion.answer && currentQuestion.answer.trim().length > 0) {
      setAnswerText(currentQuestion.answer);
      setDraftSavedAt(null);
      return;
    }

    try {
      const draftKey = `${DRAFT_STORAGE_PREFIX}${interviewId}_${currentQuestion.id}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft !== null) {
        setAnswerText(savedDraft);
        setDraftSavedAt("Restored draft");
      } else {
        setAnswerText("");
        setDraftSavedAt(null);
      }
    } catch {
      setAnswerText("");
    }
  }, [currentQuestion, interviewId]);

  // Auto-save draft to localStorage as the user types
  const handleAnswerChange = (value: string) => {
    setAnswerText(value);
    if (!interviewId || !currentQuestion) return;
    try {
      const draftKey = `${DRAFT_STORAGE_PREFIX}${interviewId}_${currentQuestion.id}`;
      if (value.trim()) {
        localStorage.setItem(draftKey, value);
        setDraftSavedAt("Draft saved");
      } else {
        localStorage.removeItem(draftKey);
        setDraftSavedAt(null);
      }
    } catch {
      // Ignore storage quota errors
    }
  };

  const plan = interview?.plan as Record<string, any> | null;
  const durationMinutes =
    Number(plan?.estimatedDuration) || navState.durationMinutes || 30;
  const difficulty = String(
    plan?.difficulty || navState.difficulty || "MEDIUM",
  ).toUpperCase();
  const roleTitle = String(
    plan?.role ||
      (interview as Record<string, any>)?.application?.job?.title ||
      navState.roleTitle ||
      interview?.title ||
      "Software Engineer",
  );
  const companyName = String(
    plan?.company ||
      (interview as Record<string, any>)?.application?.job?.company ||
      navState.companyName ||
      "Target Company",
  );

  const assessedSkill = useMemo(() => {
    if (!currentQuestion) return "Core Engineering";
    const targetSkills: string[] = Array.isArray(plan?.targetSkills)
      ? plan.targetSkills.map(String)
      : (navState.focusTopics ?? []);
    const matchedSkill = targetSkills.find((s) =>
      currentQuestion.question.toLowerCase().includes(s.toLowerCase()),
    );
    return (
      matchedSkill ||
      targetSkills[currentIndex % Math.max(1, targetSkills.length)] ||
      currentQuestion.round ||
      "Technical Competency"
    );
  }, [currentQuestion, plan, navState.focusTopics, currentIndex]);

  const answeredCount = useMemo(
    () =>
      questions.filter((q) => Boolean(q.answer && q.answer.trim().length > 0))
        .length,
    [questions],
  );

  const wordCount = useMemo(() => {
    const trimmed = answerText.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [answerText]);

  const hasSubmittedCurrent = Boolean(
    currentQuestion?.answer &&
    currentQuestion.answer.trim().length > 0 &&
    !isRedoing,
  );

  const handleSubmitAnswer = async () => {
    if (!interviewId || !currentQuestion) return;
    const trimmed = answerText.trim();
    if (!trimmed) {
      setError("Please write your response before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updated = await submitInterviewAnswer(
        interviewId,
        currentQuestion.id,
        trimmed,
      );

      // Clear local draft on successful submit
      try {
        localStorage.removeItem(
          `${DRAFT_STORAGE_PREFIX}${interviewId}_${currentQuestion.id}`,
        );
      } catch {
        // Ignore
      }

      const updatedQuestion: InterviewQuestion =
        (updated as unknown as { question?: InterviewQuestion })?.question ??
        (updated as unknown as InterviewQuestion);

      setInterview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: "IN_PROGRESS",
          questions: prev.questions.map((q) =>
            q.id === currentQuestion.id
              ? {
                  ...q,
                  answer: trimmed,
                  score:
                    updatedQuestion?.score !== undefined
                      ? updatedQuestion.score
                      : (q.score ?? 78),
                  feedback:
                    updatedQuestion?.feedback !== undefined
                      ? updatedQuestion.feedback
                      : (q.feedback ??
                        "Clear technical explanation. Review the rubric notes below before advancing."),
                }
              : q,
          ),
        };
      });

      setIsRedoing(false);
      setDraftSavedAt(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit your answer. Your draft is saved locally—please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishAndEvaluate = async () => {
    if (!interviewId) return;
    setCompleting(true);
    setError(null);

    try {
      await generateInterviewEvaluation(interviewId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["readiness"] }),
        queryClient.invalidateQueries({ queryKey: ["applications"] }),
      ]);
      navigate(`/interviews/${interviewId}/evaluation`);
    } catch (err: unknown) {
      setToastMessage(
        err instanceof Error
          ? err.message
          : "Opening your interview evaluation report...",
      );
      navigate(`/interviews/${interviewId}/evaluation`);
    } finally {
      setCompleting(false);
    }
  };

  const feedbackDetails = useMemo(
    () =>
      hasSubmittedCurrent && currentQuestion
        ? deriveQuestionFeedbackDetails(
            parseQuestionFeedback(currentQuestion.feedback),
            currentQuestion.score,
          )
        : null,
    [hasSubmittedCurrent, currentQuestion],
  );

  const isLastQuestion = currentIndex >= questions.length - 1;

  return (
    <ContentContainer size="xl" className="space-y-6">
      {/* 1. Focused Assessment Header: Job Title, Company, Timer, Question Progress, Exit Button */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {companyName}
              </span>
              <Badge tone="neutral" size="sm">
                {difficulty} · {durationMinutes}m
              </Badge>
            </div>
            <h1 className="text-base font-semibold text-content-heading sm:text-lg">
              {roleTitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Question Progress Counter */}
            <Badge tone="primary">
              Question {questions.length > 0 ? currentIndex + 1 : 0} of{" "}
              {questions.length}
            </Badge>

            {/* Elapsed Timer */}
            <div
              className="inline-flex items-center gap-1.5 rounded-input border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-content-heading tabular-nums"
              aria-label="Elapsed session time"
            >
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>
                {formatElapsed(elapsedSeconds)} / {durationMinutes}:00
              </span>
            </div>

            {/* Exit Interview Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/interviews")}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Exit interview
            </Button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <ProgressBar
            label={`Session progress (${answeredCount} of ${questions.length} questions answered)`}
            value={
              questions.length > 0
                ? (answeredCount / questions.length) * 100
                : 0
            }
            tone={
              answeredCount === questions.length && questions.length > 0
                ? "success"
                : "primary"
            }
          />
        </div>
      </Card>

      {toastMessage && (
        <Toast
          tone="neutral"
          title="Evaluation notice"
          description={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}

      {error && (
        <ErrorState
          title="Session issue"
          message={error}
          onRetry={() => void loadSession()}
        />
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-12" aria-busy="true">
          <div className="lg:col-span-4">
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : !interview || questions.length === 0 ? (
        <EmptyState
          title="No questions found for this session"
          description="Return to the preparation page to configure or restart your interview."
          action={
            <Button
              variant="primary"
              onClick={() => navigate(`/interviews/${interviewId}/prep`)}
            >
              Back to preparation
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* 5. Sidebar: Completed, Current, and Remaining Questions */}
          <div className="lg:col-span-4 space-y-4">
            <SectionCard
              eyebrow="Question Queue"
              title="Session Outline"
              description={`${answeredCount} completed · ${Math.max(
                0,
                questions.length - answeredCount,
              )} remaining`}
            >
              <ul className="space-y-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isCompleted = Boolean(
                    q.answer && q.answer.trim().length > 0,
                  );

                  return (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`flex w-full items-start justify-between gap-2.5 rounded-input border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          isCurrent
                            ? "border-primary bg-primary-soft/50"
                            : isCompleted
                              ? "border-status-success-border bg-status-success-soft/30 hover:bg-muted"
                              : "border-border bg-surface hover:bg-muted"
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-content-heading tabular-nums">
                              Q{idx + 1}
                            </span>
                            <span className="truncate text-xs font-medium text-content-secondary">
                              {q.round || "Technical"}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-xs text-content-body">
                            {q.question}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {isCompleted ? (
                            <Badge tone="success" size="sm">
                              {q.score != null ? `${q.score}%` : "Done"}
                            </Badge>
                          ) : isCurrent ? (
                            <Badge tone="primary" size="sm">
                              Current
                            </Badge>
                          ) : (
                            <Badge tone="neutral" size="sm">
                              Remaining
                            </Badge>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {answeredCount === questions.length && (
                <div className="mt-4 border-t border-border pt-4">
                  <Button
                    variant="primary"
                    fullWidth
                    loading={completing}
                    onClick={() => void handleFinishAndEvaluate()}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Complete & view evaluation
                  </Button>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right 8 Columns: 2. Current Question + 3. Answer Area + 4. Feedback State */}
          <div className="lg:col-span-8 space-y-6">
            {currentQuestion && (
              <>
                {/* 2. Current Question Card */}
                <InterviewQuestionCard
                  questionNumber={currentIndex + 1}
                  totalQuestions={questions.length}
                  question={currentQuestion.question}
                  round={currentQuestion.round}
                  skill={assessedSkill}
                  difficulty={difficulty}
                  score={hasSubmittedCurrent ? currentQuestion.score : null}
                  answer={
                    hasSubmittedCurrent
                      ? (currentQuestion.answer ?? undefined)
                      : undefined
                  }
                >
                  {/* Expected Answer Format Guidance */}
                  <div className="rounded-input border border-border bg-muted/50 p-3.5">
                    <p className="text-xs font-semibold text-content-heading">
                      Expected Answer Structure
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-content-secondary">
                      State your technical approach clearly, explain why you
                      chose it over alternatives, highlight production
                      trade-offs (latency, failure recovery, scalability), and
                      connect to a concrete example where applicable.
                    </p>
                  </div>
                </InterviewQuestionCard>

                {/* 3. Answer Area (Shown when not yet submitted or when redoing) */}
                {!hasSubmittedCurrent && (
                  <Card padding="md" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor="candidate-response-textarea"
                        className="text-sm font-semibold text-content-heading"
                      >
                        Your Technical Response
                      </label>
                      <div className="flex items-center gap-3 text-xs text-content-secondary tabular-nums">
                        {draftSavedAt && (
                          <span className="inline-flex items-center gap-1 text-status-success font-medium">
                            <FileCheck2 className="h-3.5 w-3.5" />
                            {draftSavedAt}
                          </span>
                        )}
                        <span>{wordCount} words</span>
                        <span>{answerText.length} chars</span>
                      </div>
                    </div>

                    <Textarea
                      id="candidate-response-textarea"
                      rows={8}
                      disabled={submitting}
                      placeholder="Write a clear, structured engineering answer..."
                      value={answerText}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          e.preventDefault();
                          void handleSubmitAnswer();
                        }
                      }}
                      helperText="Press Ctrl+Enter (or Cmd+Enter) to submit your answer for rubric evaluation."
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                      <div className="flex items-center gap-2">
                        {currentIndex > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={submitting}
                            onClick={() =>
                              setCurrentIndex((i) => Math.max(0, i - 1))
                            }
                          >
                            Previous question
                          </Button>
                        )}
                        {isRedoing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={submitting}
                            onClick={() => {
                              setIsRedoing(false);
                              setAnswerText(currentQuestion.answer ?? "");
                            }}
                          >
                            Cancel redo
                          </Button>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        loading={submitting}
                        disabled={!answerText.trim()}
                        onClick={() => void handleSubmitAnswer()}
                        leftIcon={<Send className="h-4 w-4" />}
                      >
                        {submitting
                          ? "Evaluating response..."
                          : "Submit answer"}
                      </Button>
                    </div>
                  </Card>
                )}

                {/* 4. Per-Answer Feedback State */}
                {submitting && (
                  <Card padding="md" className="space-y-3" aria-busy="true">
                    <p className="text-xs font-semibold text-content-heading">
                      Scoring your response against the {assessedSkill}{" "}
                      rubric...
                    </p>
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-20 w-full" />
                  </Card>
                )}

                {hasSubmittedCurrent && feedbackDetails && (
                  <FeedbackCard
                    title={`Question ${currentIndex + 1} Evaluation · ${assessedSkill}`}
                    score={currentQuestion.score ?? 78}
                    summary={feedbackDetails.summary}
                    strengths={feedbackDetails.strengths}
                    improvements={feedbackDetails.improvements}
                    suggestedAnswer={feedbackDetails.suggestedAnswer}
                    actions={
                      <div className="flex w-full flex-wrap items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsRedoing(true)}
                          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                        >
                          Redo this question
                        </Button>

                        {!isLastQuestion ? (
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() =>
                              setCurrentIndex((idx) =>
                                Math.min(questions.length - 1, idx + 1),
                              )
                            }
                            rightIcon={<ArrowRight className="h-4 w-4" />}
                          >
                            Next question
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="md"
                            loading={completing}
                            onClick={() => void handleFinishAndEvaluate()}
                            leftIcon={<CheckCircle2 className="h-4 w-4" />}
                          >
                            Complete & view evaluation report
                          </Button>
                        )}
                      </div>
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </ContentContainer>
  );
};

export default LiveInterviewPage;
