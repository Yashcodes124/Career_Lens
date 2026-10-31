import { prisma } from "../config/db";
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
} from "../repositories/interviewRepository";
import { AppError } from "../utils/appError";
import { saveEvaluationWithSkillEvidence } from "../repositories/skillRepository";
import { skillEvidenceFromReport } from "./skills/skillEvidence";
import {
  buildInterviewQuestionsPrompt,
  InterviewQuestionPromptInput,
} from "../modules/interview/interview.question.prompt";
import { evaluateQuestionAnswer } from "../modules/interview/interview.ai";
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

  if (duration <= 15) {
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
): Promise<InterviewPlan> => {
  const prompt = buildInterviewPlanPrompt(input);
  const rawResponse = await analyzeResume(prompt);

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
      (customConfig.focusTopics && customConfig.focusTopics.length > 0)),
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
    const generatedPlan = await generateInterviewPlan(promptInput);
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

  const generatedQuestions = await generateInterviewQuestions({
    plan,
    job: application.job,
    resume,
    matchScore,
    topSkillGaps,
    questionCount: hasCustomOptions ? desiredQuestionCount : undefined,
    strictSkillFocus: hasCustomOptions,
  });

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

  return await prisma.interview.findUnique({
    where: { id: interview.id },
    include: { questions: true },
  });
};

export const generateInterviewQuestions = async (
  input: InterviewQuestionPromptInput,
): Promise<InterviewQuestions> => {
  const prompt = buildInterviewQuestionsPrompt(input);
  const rawResponse = await analyzeResume(prompt);

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
    JSON.stringify(evaluation),
    evaluation.score,
  );

  const isCompleted = (await countUnfinishedQuestions(interviewId)) === 0;
  if (isCompleted) {
    await updateInterviewStatus(interviewId, userId, "COMPLETED");
  }

  return {
    evaluation,
    updatedQuestion,
    nextQuestion: isCompleted
      ? null
      : await getFirstUnfinishedQuestion(interviewId),
    completed: isCompleted,
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
      feedback: q.feedback,
    })),
  });

  const aiResponse = await analyzeResume(prompt);

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

  return await saveEvaluationWithSkillEvidence(
    interviewId,
    userId,
    validatedEvaluation,
    skillEvidenceFromReport(validatedEvaluation),
  );
};
