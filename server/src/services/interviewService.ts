//server/src/modules/interview/interview.service.ts

import { prisma } from "../config/db";
import { analyzeResume } from "../integrations/ai/aiClient";
import {
  buildInterviewPlanPrompt,
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
  saveFinalEvaluation,
} from "../repositories/interviewRepository";
import { AppError } from "../utils/appError";
import {
  buildInterviewQuestionsPrompt,
  InterviewQuestionPromptInput,
} from "../modules/interview/interview.question.prompt";
import { evaluateQuestionAnswer } from "../modules/interview/interview.ai";
import { buildFinalEvaluationPrompt } from "../modules/evaluation/interview.evaluation.prompt";
import { FinalEvaluationSchema } from "../modules/evaluation/finalEvaluationSchema";

export const generateInterviewPlan = async (
  input: InterviewPromptInput,
): Promise<InterviewPlan> => {
  // 1. Build prompt
  const prompt = buildInterviewPlanPrompt(input);

  // 2. Call existing AI client abstraction
  const rawResponse = await analyzeResume(prompt);

  // 3. Handle JSON parsing (if analyzeResume returned string instead of parsed object)
  const jsonContent =
    typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;

  // 4. Validate output with InterviewPlanSchema
  const parsed = InterviewPlanSchema.safeParse(jsonContent);
  if (!parsed.success) {
    throw new AppError(502, "The interview plan could not be generated. Try again.", "AI_INVALID_OUTPUT");
  }
  return parsed.data;
};

export const createInterviewService = async (
  userId: string,
  applicationId: string,
) => {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId },
    include: { job: true },
  });
  if (!application || !application.job) {
    throw new AppError(404, "Application or associated job not found", "APPLICATION_NOT_FOUND");
  }

  const resume = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!resume) {
    throw new AppError(400, "Upload a resume before starting an interview", "RESUME_REQUIRED");
  }

  // A job with no comparable skills has a null match score. It is never replaced with a number.
  const matchScore = application.matchScore ?? null;
  const topSkillGaps = application.skillGaps ?? [];

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

  // All AI work happens before any write. If it fails, nothing is saved.
  // The model may echo a score. The stored value is the only one we keep.
  const generatedPlan = await generateInterviewPlan(promptInput);
  const plan = { ...generatedPlan, matchScore };
  const generatedQuestions = await generateInterviewQuestions({
    plan,
    job: application.job,
    resume,
    matchScore,
    topSkillGaps,
  });

  const title = `${application.job.title} at ${application.job.company}`;
  const interview = await createInterviewWithQuestions(
    { userId, applicationId, title, plan },
    generatedQuestions.questions,
  );

  return await prisma.interview.findUnique({
    where: { id: interview.id },
    include: { questions: true },
  });
};

export const generateInterviewQuestions = async (
  input: InterviewQuestionPromptInput,
): Promise<InterviewQuestions> => {
  //build prompt
  const prompt = buildInterviewQuestionsPrompt(input);

  //call the ai client abstrcation
  const rawResponse = await analyzeResume(prompt);

  //clean and parse json response
  let jsonContent =
    typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;

  // / Handle case where response might be wrapped inside a code block string
  if (typeof jsonContent === "string") {
    const cleaned = jsonContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    jsonContent = JSON.parse(cleaned);
  }

  //validate output
  const validatedQuestions = InterviewQuestionsSchema.parse(jsonContent);

  return validatedQuestions;
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
  //fetch the inteview
  const interview = await getInterviewSessionById(interviewId, userId);
  if (!interview) {
    throw new Error("Interview session not found");
  }
  //validate the status
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

  //update transition status to IN_PROGRESS
  await updateInterviewStatus(interviewId, userId, "IN_PROGRESS");

  //fetch the updated interview
  const updatedInterview = await getInterviewSessionById(interviewId, userId);

  //send interview and 1st question like (order 1)
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
    throw new AppError(404, "Interview session not found", "INTERVIEW_NOT_FOUND");
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
    throw new AppError(404, "Question not found for this interview", "QUESTION_NOT_FOUND");
  }

  // A question is final once it has feedback. Only unevaluated questions can take an answer.
  if (question.feedback !== null) {
    throw new AppError(409, "This question has already been answered", "ALREADY_ANSWERED");
  }

  // Questions are answered in order. The next one is the first without feedback.
  const nextDue = interview.questions.find((q) => q.feedback === null);
  if (!nextDue || nextDue.id !== questionId) {
    throw new AppError(
      409,
      `Answer the questions in order. Question ${nextDue?.order ?? ""} is next.`.trim(),
      "OUT_OF_ORDER",
    );
  }

  // Save first. If the evaluation below fails, the answer is still on record.
  await saveAnswer(questionId, answer);

  let evaluation: Awaited<ReturnType<typeof evaluateQuestionAnswer>>;
  try {
    evaluation = await evaluateQuestionAnswer(question.question, answer, interview.title);
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

  // Completed means no question is left without feedback, whatever order they were answered in.
  const isCompleted = (await countUnfinishedQuestions(interviewId)) === 0;
  if (isCompleted) {
    await updateInterviewStatus(interviewId, userId, "COMPLETED");
  }

  return {
    evaluation,
    updatedQuestion,
    nextQuestion: isCompleted ? null : await getFirstUnfinishedQuestion(interviewId),
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
    throw new AppError(409, "An evaluation already exists for this interview", "EVALUATION_EXISTS");
  }

  // 4. Extract role and application context
  const application = interview.application;
  const job = application?.job;
  const jobTitle = job?.title || "Software Engineer";
  const companyName = job?.company || "Target Company";
  const roleDescription = job?.description || "";
  // No match score is stored when the posting had no comparable skills. Never invent one.
  const matchScore = application?.matchScore ?? null;
  const skillGaps = application?.skillGaps || [];

  // 5. Build prompt
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

  // 6. Request evaluation from Nemotron
  const aiResponse = await analyzeResume(prompt);

  let rawEvaluation: any;

  if (typeof aiResponse === "string") {
    // If string, sanitize markdown formatting and parse
    const cleanedResponse = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    rawEvaluation = JSON.parse(cleanedResponse);
  } else {
    // If already parsed object, use directly
    rawEvaluation = aiResponse;
  }
  // Normalize key names if Nemotron misspells "confidence" as "confidance"
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

  // 8. Persist to PostgreSQL
  const savedEvaluation = await saveFinalEvaluation(
    interviewId,
    validatedEvaluation,
  );

  return savedEvaluation;
};
