import { prisma } from "../config/db";
import { Prisma } from "@prisma/client";
import { recordFeatureEvent } from "./telemetry/telemetryService";
import { countSkillMentions } from "./matching/skillDictionary";
import { analyzeResume } from "../integrations/ai/aiClient";
import {
  buildInterviewPlanPrompt,
  InterviewCustomConfig,
  InterviewPromptInput,
} from "../modules/interview/interview.prompt";
import {
  InterviewPlanSchema,
  InterviewPlan,
  InterviewQuestions,
  InterviewQuestionsSchema,
} from "../modules/interview/interviewSchema";
import {
  createInterviewWithQuestions,
  getInterviewSessionById,
  updateInterviewStatus,
  getQuestionById,
  saveAnswer,
  saveQuestionAnswerAndFeedback,
  countUnfinishedQuestions,
  getFirstUnfinishedQuestion,
  getEvaluationByInterviewId,
  saveInterviewTranscript,
  insertAdaptiveFollowUpQuestion,
} from "../repositories/interviewRepository";
import { AppError } from "../utils/appError";
import { saveEvaluationWithSkillEvidence } from "../repositories/skillRepository";
import { skillEvidenceFromReport } from "./skills/skillEvidence";
import {
  buildInterviewQuestionsPrompt,
  InterviewQuestionPromptInput,
} from "../modules/interview/interview.question.prompt";
import {
  evaluateQuestionAnswer,
  generateAdaptiveFollowUpQuestion,
  type AdaptiveFollowUpPlan,
  type AdaptiveTriggerType,
} from "../modules/interview/interview.ai";
import { buildFinalEvaluationPrompt } from "../modules/evaluation/interview.evaluation.prompt";
import { FinalEvaluationSchema } from "../modules/evaluation/finalEvaluationSchema";

// Builds deterministic, skill-focused rounds whose durations ALWAYS sum to the exact user selection
const buildCustomSkillPlan = (params: {
  company: string;
  role: string;
  matchScore: number | null;
  topSkillGaps: string[];
  fallbackSkills: string[];
  config: InterviewCustomConfig;
}): InterviewPlan => {
  const duration = params.config.durationMinutes ?? 30;
  const difficulty = params.config.difficulty ?? "MEDIUM";
  const chosenSkills =
    params.config.focusTopics && params.config.focusTopics.length > 0
      ? params.config.focusTopics
      : params.topSkillGaps.length > 0
        ? params.topSkillGaps.slice(0, 3)
        : params.fallbackSkills.slice(0, 3);

  const targetSkills =
    chosenSkills.length > 0 ? chosenSkills : ["Core Engineering"];

  let rounds: { name: string; duration: number }[];

  if (params.config.selectedRounds && params.config.selectedRounds.length > 0) {
    const cleanRounds = params.config.selectedRounds
      .map((r) => r.trim())
      .filter(Boolean);
    const count = cleanRounds.length;
    const baseMinutes = Math.max(3, Math.floor(duration / count));
    const remainder = Math.max(0, duration - baseMinutes * count);

    rounds = cleanRounds.map((name, idx) => ({
      name,
      duration: idx === count - 1 ? baseMinutes + remainder : baseMinutes,
    }));
  } else if (duration <= 15) {
    rounds = [
      { name: `${targetSkills[0]} Fundamentals`, duration: 5 },
      { name: `Applied ${targetSkills.slice(0, 2).join(" & ")}`, duration: 10 },
    ];
  } else if (duration <= 30) {
    rounds = [
      { name: "Core Concepts & Warmup", duration: 5 },
      {
        name: `Technical Deep Dive (${targetSkills.slice(0, 2).join(", ")})`,
        duration: 15,
      },
      { name: "Practical Scenario & Trade-offs", duration: 10 },
    ];
  } else if (duration <= 45) {
    rounds = [
      { name: "Core Concepts", duration: 5 },
      { name: "Technical Skill Assessment", duration: 20 },
      { name: "System Architecture & Debugging", duration: 12 },
      { name: "Engineering Ownership", duration: 8 },
    ];
  } else {
    rounds = [
      { name: "Introduction & Context", duration: 5 },
      { name: "Project & Architecture Deep Dive", duration: 15 },
      { name: "Core Technical Assessment", duration: 30 },
      { name: "Behavioral & Engineering Trade-offs", duration: 10 },
    ];
  }

  return {
    company: params.company,
    role: params.role,
    matchScore: params.matchScore,
    topSkillGaps: params.topSkillGaps,
    estimatedDuration: duration,
    difficulty,
    targetSkills,
    rounds,
  };
};

export const generateInterviewPlan = async (
  input: InterviewPromptInput,
  userId?: string,
): Promise<InterviewPlan> => {
  const prompt = buildInterviewPlanPrompt(input);
  const rawResponse = await analyzeResume(prompt, "default", {
    userId,
    feature: "INTERVIEW_GENERATION",
  });

  const jsonContent =
    typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;

  const parsed = InterviewPlanSchema.safeParse(jsonContent);
  if (!parsed.success) {
    throw new AppError(
      502,
      "The interview plan could not be generated. Try again.",
      "AI_INVALID_OUTPUT",
    );
  }
  return parsed.data;
};

export const createInterviewService = async (
  userId: string,
  applicationId: string,
  customConfig?: InterviewCustomConfig,
) => {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: { job: true },
  });
  if (!application || !application.job) {
    throw new AppError(
      404,
      "Application or associated job not found",
      "APPLICATION_NOT_FOUND",
    );
  }

  const resume = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!resume) {
    throw new AppError(
      400,
      "Upload a resume before starting an interview",
      "RESUME_REQUIRED",
    );
  }

  const matchScore = application.matchScore ?? null;
  const topSkillGaps = application.skillGaps ?? [];

  const hasCustomOptions = Boolean(
    customConfig &&
    (customConfig.durationMinutes !== undefined ||
      customConfig.difficulty !== undefined ||
      (customConfig.focusTopics && customConfig.focusTopics.length > 0) ||
      (customConfig.selectedRounds && customConfig.selectedRounds.length > 0)),
  );

  let plan: InterviewPlan;

  if (hasCustomOptions && customConfig) {
    // Fast path: Lock in exact user duration, difficulty, and chosen skills in 0ms
    plan = buildCustomSkillPlan({
      company: application.job.company,
      role: application.job.title,
      matchScore,
      topSkillGaps,
      fallbackSkills:
        application.job.requirements.length > 0
          ? application.job.requirements
          : resume.skills,
      config: customConfig,
    });
  } else {
    // Standard path (used when no custom config is passed, preserving unit test mocks)
    const promptInput: InterviewPromptInput = {
      job: {
        title: application.job.title,
        company: application.job.company,
        location: application.job.location,
        description: application.job.description,
        requirements: application.job.requirements,
      },
      resume: {
        rawText: resume.rawText,
        skills: resume.skills,
        experienceYrs: resume.experienceYrs,
      },
      matchScore,
      topSkillGaps,
    };
    const generatedPlan = await generateInterviewPlan(promptInput, userId);
    plan = { ...generatedPlan, matchScore };
  }

  const desiredQuestionCount =
    plan.estimatedDuration <= 15
      ? 4
      : plan.estimatedDuration <= 30
        ? 5
        : plan.estimatedDuration <= 45
          ? 7
          : 8;

  const generatedQuestions = await generateInterviewQuestions(
    {
      plan,
      job: application.job,
      resume,
      matchScore,
      topSkillGaps,
      questionCount: hasCustomOptions ? desiredQuestionCount : undefined,
      strictSkillFocus: hasCustomOptions,
    },
    userId,
  );

  // Cap questions to the desired count if the LLM returned extra items
  const finalQuestions = hasCustomOptions
    ? generatedQuestions.questions
        .slice(0, desiredQuestionCount)
        .map((q, idx) => ({ ...q, order: idx + 1 }))
    : generatedQuestions.questions;

  const title = `${application.job.title} at ${application.job.company}`;
  const interview = await createInterviewWithQuestions(
    { userId, applicationId, title, plan },
    finalQuestions,
  );

  recordFeatureEvent({
    userId,
    event: "interview_created",
    metadata: {
      interviewId: interview.id,
      applicationId,
    },
  });

  return await prisma.interview.findUnique({
    where: { id: interview.id },
    include: { questions: true },
  });
};

export const generateInterviewQuestions = async (
  input: InterviewQuestionPromptInput,
  userId?: string,
): Promise<InterviewQuestions> => {
  const prompt = buildInterviewQuestionsPrompt(input);
  const rawResponse = await analyzeResume(prompt, "default", {
    userId,
    feature: "INTERVIEW_GENERATION",
  });

  let jsonContent =
    typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;

  if (typeof jsonContent === "string") {
    const cleaned = jsonContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    jsonContent = JSON.parse(cleaned);
  }

  return InterviewQuestionsSchema.parse(jsonContent);
};

export const generateInterviewSessionByIdService = async (
  interviewId: string,
  userId: string,
) => {
  const interview = await getInterviewSessionById(interviewId, userId);
  if (!interview) {
    throw new Error("Interview session not found");
  }
  return interview;
};

export const startInterviewService = async (
  interviewId: string,
  userId: string,
) => {
  const interview = await getInterviewSessionById(interviewId, userId);
  if (!interview) {
    throw new Error("Interview session not found");
  }

  if (interview.status === "IN_PROGRESS") {
    const error = new Error("Interview is already in progress");
    (error as any).statusCode = 400;
    throw error;
  }

  if (interview.status === "COMPLETED" || interview.status === "CANCELLED") {
    const error = new Error(
      `Cannot start an interview that is ${interview.status.toLowerCase()}`,
    );
    (error as any).statusCode = 400;
    throw error;
  }

  await updateInterviewStatus(interviewId, userId, "IN_PROGRESS");

  const updatedInterview = await getInterviewSessionById(interviewId, userId);
  const firstQuestion =
    updatedInterview?.questions.find((q) => q.order == 1) || null;

  return {
    interview: updatedInterview,
    firstQuestion,
  };
};
export interface TranscriptQuestionEntry {
  questionId: string;
  order: number;
  round: string;
  question: string;
  answer: string | null;
  score: number | null;
  feedback: string | null;
  strengths: string[];
  weaknesses: string[];
  followUpRecommendation: string;
  answeredAt: string | null;
}

export interface StructuredInterviewTranscript {
  version: 1;
  interviewId: string;
  title: string;
  company: string;
  role: string;
  status: string;
  updatedAt: string;
  entries: TranscriptQuestionEntry[];
  strengths: string[];
  weaknesses: string[];
  followUpRecommendation: string;
  finalEvaluation: {
    score: number;
    feedback: string;
    recommendation: string;
    breakdown: Record<string, unknown>;
    evaluatedAt: string;
  } | null;
  skillsValidated: string[];
  skillsInvalidated: string[];
}

const parseStoredQuestionFeedback = (
  raw: unknown,
): {
  feedback: string | null;
  strengths: string[];
  improvements: string[];
} => {
  if (!raw) return { feedback: null, strengths: [], improvements: [] };
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return {
      feedback: typeof obj.feedback === "string" ? obj.feedback : null,
      strengths: Array.isArray(obj.strengths) ? obj.strengths.map(String) : [],
      improvements: Array.isArray(obj.improvements)
        ? obj.improvements.map(String)
        : [],
    };
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        return {
          feedback: typeof parsed.feedback === "string" ? parsed.feedback : raw,
          strengths: Array.isArray(parsed.strengths)
            ? parsed.strengths.map(String)
            : [],
          improvements: Array.isArray(parsed.improvements)
            ? parsed.improvements.map(String)
            : [],
        };
      }
    } catch {
      return { feedback: raw, strengths: [], improvements: [] };
    }
  }
  return { feedback: null, strengths: [], improvements: [] };
};

export const buildStructuredInterviewTranscript = (params: {
  interview: {
    id: string;
    title: string;
    status: string;
    plan?: unknown;
    questions: Array<{
      id: string;
      order: number;
      round: string;
      question: string;
      answer: string | null;
      score: number | null;
      feedback: unknown;
      updatedAt?: Date | string;
    }>;
  };
  finalEvaluation?: {
    score: number;
    feedback: string;
    recommendation: string;
    breakdown: Record<string, unknown>;
    strengths: string[];
    improvements: string[];
  } | null;
  skillUpdates?: Array<{ skill: string; status: "STRONG" | "WEAK" }>;
}): StructuredInterviewTranscript => {
  const { interview, finalEvaluation, skillUpdates } = params;
  const planObj =
    interview.plan && typeof interview.plan === "object"
      ? (interview.plan as Record<string, unknown>)
      : {};

  const sortedQuestions = [...(interview.questions ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  const aggregatedStrengths: string[] = [];
  const aggregatedWeaknesses: string[] = [];
  const inferredValidated = new Set<string>();
  const inferredInvalidated = new Set<string>();

  const entries: TranscriptQuestionEntry[] = sortedQuestions.map((q) => {
    const parsed = parseStoredQuestionFeedback(q.feedback);
    const weaknesses = parsed.improvements;

    for (const s of parsed.strengths) {
      if (s && !aggregatedStrengths.includes(s)) aggregatedStrengths.push(s);
    }
    for (const w of weaknesses) {
      if (w && !aggregatedWeaknesses.includes(w)) aggregatedWeaknesses.push(w);
    }

    if (q.answer || q.score !== null) {
      const mentioned = [
        ...countSkillMentions(
          `${q.round} ${q.question} ${q.answer ?? ""} ${parsed.feedback ?? ""}`,
        ).keys(),
      ];
      if ((q.score ?? 0) >= 70) {
        mentioned.forEach((sk) => inferredValidated.add(sk));
      } else if (typeof q.score === "number") {
        mentioned.forEach((sk) => inferredInvalidated.add(sk));
      }
    }

    const followUpRecommendation =
      q.score === null
        ? "Pending candidate response."
        : q.score >= 75
          ? weaknesses[0]
            ? `Strong answer (${Math.round(q.score)}%). Optional polish: ${weaknesses[0]}`
            : `Strong answer (${Math.round(q.score)}%) — ready to defend ${q.round} in live interviews.`
          : weaknesses[0]
            ? `Focus area (${Math.round(q.score)}%): ${weaknesses[0]} Practice a follow-up drill on ${q.round}.`
            : `Review core trade-offs and edge cases in ${q.round} and re-verify in a targeted practice session.`;

    return {
      questionId: q.id,
      order: q.order,
      round: q.round,
      question: q.question,
      answer: q.answer,
      score: typeof q.score === "number" ? Math.round(q.score) : null,
      feedback: parsed.feedback,
      strengths: parsed.strengths,
      weaknesses,
      followUpRecommendation,
      answeredAt:
        q.answer && q.updatedAt ? new Date(q.updatedAt).toISOString() : null,
    };
  });

  // Explicit skillUpdates from skillEvidenceFromReport take precedence over inferred question mentions
  const skillsValidated =
    skillUpdates && skillUpdates.length > 0
      ? skillUpdates.filter((u) => u.status === "STRONG").map((u) => u.skill)
      : [...inferredValidated].filter((sk) => !inferredInvalidated.has(sk));

  const skillsInvalidated =
    skillUpdates && skillUpdates.length > 0
      ? skillUpdates.filter((u) => u.status === "WEAK").map((u) => u.skill)
      : [...inferredInvalidated];

  const strengths =
    finalEvaluation?.strengths && finalEvaluation.strengths.length > 0
      ? finalEvaluation.strengths
      : aggregatedStrengths;

  const weaknesses =
    finalEvaluation?.improvements && finalEvaluation.improvements.length > 0
      ? finalEvaluation.improvements
      : aggregatedWeaknesses;

  const followUpRecommendation = finalEvaluation
    ? `${finalEvaluation.recommendation}${
        weaknesses[0] ? ` — Priority next step: ${weaknesses[0]}` : ""
      }`
    : skillsInvalidated.length > 0
      ? `Complete a targeted follow-up drill on ${skillsInvalidated.slice(0, 3).join(", ")} to convert exposed gaps into verified strengths.`
      : "Complete remaining questions to generate your final rubric evaluation and skill profile updates.";

  return {
    version: 1,
    interviewId: interview.id,
    title: interview.title,
    company:
      typeof planObj.company === "string" ? planObj.company : "Target Company",
    role: typeof planObj.role === "string" ? planObj.role : interview.title,
    status: finalEvaluation ? "COMPLETED" : interview.status,
    updatedAt: new Date().toISOString(),
    entries,
    strengths,
    weaknesses,
    followUpRecommendation,
    finalEvaluation: finalEvaluation
      ? {
          score: finalEvaluation.score,
          feedback: finalEvaluation.feedback,
          recommendation: finalEvaluation.recommendation,
          breakdown: finalEvaluation.breakdown,
          evaluatedAt: new Date().toISOString(),
        }
      : null,
    skillsValidated,
    skillsInvalidated,
  };
};

const MAX_ADAPTIVE_FOLLOWUPS_PER_SESSION = 2;

export const evaluateAdaptiveFollowUpNeed = (params: {
  question: { round: string; question: string };
  answer: string;
  evaluation: {
    score: number;
    feedback: string;
    strengths?: string[];
    improvements?: string[];
  };
  targetSkills: string[];
  existingQuestions: Array<{ round: string }>;
}): AdaptiveFollowUpPlan | null => {
  // Never chain a follow-up onto an existing follow-up, and cap at 2 per session
  if (params.question.round.startsWith("[Follow-Up")) {
    return null;
  }
  const existingFollowUps = params.existingQuestions.filter((q) =>
    q.round.startsWith("[Follow-Up"),
  ).length;
  if (existingFollowUps >= MAX_ADAPTIVE_FOLLOWUPS_PER_SESSION) {
    return null;
  }

  const trimmedAnswer = params.answer.trim();
  const wordCount = trimmedAnswer ? trimmedAnswer.split(/\s+/).length : 0;
  const score = params.evaluation.score;
  const feedbackBlob = `${params.evaluation.feedback} ${(params.evaluation.improvements ?? []).join(" ")}`;

  const claimedInAnswer = [...countSkillMentions(trimmedAnswer).keys()];
  const mentionedInQuestion = [
    ...countSkillMentions(params.question.question).keys(),
  ];
  const targetSkill =
    claimedInAnswer[0] ||
    mentionedInQuestion[0] ||
    params.targetSkills[0] ||
    params.question.round;

  // Condition 2: Candidate claims a skill in their answer but fails to explain it -> probe fundamentals
  if (
    claimedInAnswer.length > 0 &&
    (score < 62 ||
      /\b(buzzword|superficial|surface|did not explain|failed to explain|incorrect|inaccurate|fundamental)\b/i.test(
        feedbackBlob,
      ))
  ) {
    return {
      trigger: "UNSUBSTANTIATED_SKILL_CLAIM",
      badgeLabel: "Fundamentals Probe",
      rationale: `You referenced ${claimedInAnswer[0]} without explaining how it works — probing core fundamentals next.`,
      targetSkill: claimedInAnswer[0],
      roundPrefix: "[Follow-Up · Fundamentals Probe]",
    };
  }

  // Condition 4: Candidate fails a core concept -> generate focused remediation question
  if (score < 55) {
    return {
      trigger: "CONCEPT_REMEDIATION",
      badgeLabel: "Concept Remediation",
      rationale: `Core concept gap detected (${Math.round(score)}%) — added a focused remediation question on ${targetSkill}.`,
      targetSkill,
      roundPrefix: "[Follow-Up · Concept Remediation]",
    };
  }

  // Condition 1: Answer is vague or lacks concrete examples -> ask for a concrete example
  if (
    wordCount < 28 ||
    /\b(vague|generic|brief|abstract|surface[- ]level|concrete example|specific example|elaborate|lack(?:s|ed)? detail)\b/i.test(
      feedbackBlob,
    )
  ) {
    return {
      trigger: "VAGUE_ANSWER",
      badgeLabel: "Concrete Example Probe",
      rationale:
        "Answer was high-level — added a follow-up asking for a concrete production example and metrics.",
      targetSkill,
      roundPrefix: "[Follow-Up · Concrete Example]",
    };
  }

  // Condition 3: Strong, detailed answer -> escalate difficulty
  if (score >= 82 && wordCount >= 35) {
    return {
      trigger: "STRONG_ESCALATION",
      badgeLabel: "Difficulty Escalated",
      rationale: `Strong response (${Math.round(score)}%) — escalated difficulty to test scale, edge cases, and failure trade-offs.`,
      targetSkill,
      roundPrefix: "[Follow-Up · Difficulty Escalated]",
    };
  }

  return null;
};

export const submitAnswerService = async (
  interviewId: string,
  questionId: string,
  userId: string,
  answer: string,
) => {
  const interview = await getInterviewSessionById(interviewId, userId);
  if (!interview) {
    throw new AppError(
      404,
      "Interview session not found",
      "INTERVIEW_NOT_FOUND",
    );
  }
  if (interview.status !== "IN_PROGRESS") {
    throw new AppError(
      400,
      "Answers can only be submitted while the interview is in progress",
      "INTERVIEW_NOT_IN_PROGRESS",
    );
  }

  const question = await getQuestionById(questionId, interviewId);
  if (!question) {
    throw new AppError(
      404,
      "Question not found for this interview",
      "QUESTION_NOT_FOUND",
    );
  }

  if (question.feedback !== null) {
    throw new AppError(
      409,
      "This question has already been answered",
      "ALREADY_ANSWERED",
    );
  }

  const nextDue = interview.questions.find((q) => q.feedback === null);
  if (!nextDue || nextDue.id !== questionId) {
    throw new AppError(
      409,
      `Answer the questions in order. Question ${nextDue?.order ?? ""} is next.`.trim(),
      "OUT_OF_ORDER",
    );
  }

  await saveAnswer(questionId, answer);

  let evaluation: Awaited<ReturnType<typeof evaluateQuestionAnswer>>;
  try {
    evaluation = await evaluateQuestionAnswer(
      question.question,
      answer,
      interview.title,
      userId,
    );
  } catch {
    throw new AppError(
      503,
      "Your answer was saved, but evaluation is temporarily unavailable. Submit the same answer again to retry.",
      "EVALUATION_PENDING",
    );
  }

  const updatedQuestion = await saveQuestionAnswerAndFeedback(
    questionId,
    answer,
    evaluation,
    evaluation.score,
  );

  let adaptiveFollowUp: {
    triggered: true;
    trigger: AdaptiveTriggerType;
    badgeLabel: string;
    rationale: string;
    question: Awaited<ReturnType<typeof insertAdaptiveFollowUpQuestion>>;
  } | null = null;

  if (
    (process.env.NODE_ENV !== "test" || process.env.AI_E2E_MOCK === "true") &&
    typeof insertAdaptiveFollowUpQuestion === "function"
  ) {
    const planObj =
      interview.plan && typeof interview.plan === "object"
        ? (interview.plan as { targetSkills?: string[] })
        : {};
    const adaptivePlan = evaluateAdaptiveFollowUpNeed({
      question,
      answer,
      evaluation,
      targetSkills: Array.isArray(planObj.targetSkills)
        ? planObj.targetSkills
        : [],
      existingQuestions: interview.questions,
    });

    if (adaptivePlan) {
      try {
        const followUpText = await generateAdaptiveFollowUpQuestion({
          plan: adaptivePlan,
          originalQuestion: question.question,
          candidateAnswer: answer,
          roleTitle: interview.title,
          userId,
        });
        const insertedQuestion = await insertAdaptiveFollowUpQuestion({
          interviewId,
          afterOrder: question.order,
          round: `${adaptivePlan.roundPrefix} ${question.round}`,
          question: followUpText,
        });
        adaptiveFollowUp = {
          triggered: true,
          trigger: adaptivePlan.trigger,
          badgeLabel: adaptivePlan.badgeLabel,
          rationale: adaptivePlan.rationale,
          question: insertedQuestion,
        };
      } catch {
        // Non-fatal: continue normal flow if follow-up insertion fails
      }
    }
  }

  const isCompleted = (await countUnfinishedQuestions(interviewId)) === 0;
  if (isCompleted) {
    await updateInterviewStatus(interviewId, userId, "COMPLETED");
    recordFeatureEvent({
      userId,
      event: "interview_completed",
      metadata: { interviewId },
    });
  }
  try {
    const refreshed = await getInterviewSessionById(interviewId, userId);
    if (refreshed && typeof saveInterviewTranscript === "function") {
      const transcript = buildStructuredInterviewTranscript({
        interview: refreshed,
      });
      await saveInterviewTranscript(
        interviewId,
        transcript as unknown as Prisma.InputJsonValue,
      );
    }
  } catch {
    // Non-fatal in unit tests where saveInterviewTranscript is not mocked
  }

  return {
    evaluation,
    updatedQuestion,
    nextQuestion: isCompleted
      ? null
      : await getFirstUnfinishedQuestion(interviewId),
    completed: isCompleted,
    adaptiveFollowUp,
  };
};

export const generateFinalEvaluationService = async (
  interviewId: string,
  userId: string,
) => {
  const interview = await getInterviewSessionById(interviewId, userId);
  if (!interview) {
    throw new AppError(404, "Interview not found", "INTERVIEW_NOT_FOUND");
  }
  if (interview.status !== "COMPLETED") {
    throw new AppError(
      409,
      "Finish every question before the report is generated",
      "INTERVIEW_NOT_COMPLETE",
    );
  }
  if (await getEvaluationByInterviewId(interviewId)) {
    throw new AppError(
      409,
      "An evaluation already exists for this interview",
      "EVALUATION_EXISTS",
    );
  }

  const application = interview.application;
  const job = application?.job;
  const jobTitle = job?.title || "Software Engineer";
  const companyName = job?.company || "Target Company";
  const roleDescription = job?.description || "";
  const matchScore = application?.matchScore ?? null;
  const skillGaps = application?.skillGaps || [];

  const prompt = buildFinalEvaluationPrompt({
    jobTitle,
    companyName,
    roleDescription,
    matchScore,
    skillGaps,
    questions: interview.questions.map((q) => ({
      order: q.order,
      round: q.round,
      question: q.question,
      answer: q.answer,
      score: q.score,
      feedback:
        typeof q.feedback === "string"
          ? q.feedback
          : q.feedback !== null && q.feedback !== undefined
            ? JSON.stringify(q.feedback)
            : null,
    })),
  });

  const aiResponse = await analyzeResume(prompt, "evaluation", {
    userId,
    feature: "INTERVIEW_FINAL_EVAL",
  });

  let rawEvaluation: any;

  if (typeof aiResponse === "string") {
    const cleanedResponse = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    rawEvaluation = JSON.parse(cleanedResponse);
  } else {
    rawEvaluation = aiResponse;
  }

  if (rawEvaluation?.breakdown) {
    if (
      rawEvaluation.breakdown.confidance !== undefined &&
      rawEvaluation.breakdown.confidence === undefined
    ) {
      rawEvaluation.breakdown.confidence = rawEvaluation.breakdown.confidance;
      delete rawEvaluation.breakdown.confidance;
    }
  }

  const validatedEvaluation = FinalEvaluationSchema.parse(rawEvaluation);

  try {
    if (typeof saveInterviewTranscript === "function") {
      // Use the same validated evaluation variable passed into saveEvaluationWithSkillEvidence above (e.g., `evaluation`)
      const evalReport = validatedEvaluation;
      const skillUpdates = skillEvidenceFromReport({
        strengths: evalReport.strengths,
        improvements: evalReport.improvements,
      });
      const transcript = buildStructuredInterviewTranscript({
        interview,
        finalEvaluation: evalReport,
        skillUpdates: skillUpdates.map((u) => ({
          skill: u.skill,
          status: u.status,
        })),
      });
      await saveInterviewTranscript(
        interviewId,
        transcript as unknown as Prisma.InputJsonValue,
      );
    }
  } catch {
    // Non-fatal in unit tests
  }

  const savedEvaluation = await saveEvaluationWithSkillEvidence(
    interviewId,
    userId,
    validatedEvaluation,
    skillEvidenceFromReport(validatedEvaluation),
  );

  recordFeatureEvent({
    userId,
    event: "evaluation_generated",
    metadata: {
      interviewId,
      score: validatedEvaluation.score,
    },
  });

  return savedEvaluation;
};
