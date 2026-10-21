// server/src/modules/interview/interview.repository.ts

import { prisma } from "../config/db";
import { InterviewQuestion } from "../modules/interview/interviewSchema";
import { FinalEvaluation } from "../modules/evaluation/finalEvaluationSchema";

//POST /api/interviews
export const createInterview = async (data: {
  userId: string;
  applicationId: string;
  title: string;
  plan: object;
}) => {
  return await prisma.interview.create({
    data,
  });
};

//POST /api/interviews
export const createInterviewQuestions = async (
  interviewId: string,
  questions: InterviewQuestion[],
) => {
  return await prisma.interviewQuestion.createMany({
    data: questions.map((q) => ({
      interviewId,
      round: q.round,
      question: q.question,
      order: q.order,
    })),
  });
};

// GET /api/interviews/:interviewId
export const getInterviewSessionById = async (
  interviewId: string,
  userId: string,
) => {
  return await prisma.interview.findUnique({
    where: {
      id: interviewId,
      userId: userId,
    },
    include: {
      questions: {
        orderBy: {
          order: "asc",
        },
      },
      evaluation: true,
      application: {
        include: {
          job: true,
        },
      },
    },
  });
};

//POST /api/interviews/:interviewId/start
export const updateInterviewStatus = async (
  interviewId: string,
  userId: string,
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
) => {
  return await prisma.interview.updateMany({
    where: {
      id: interviewId,
      userId: userId,
    },
    data: {
      status: status,
    },
  });
};

//localhost:5000/api/interviews/id
export const getQuestionById = async (
  questionId: string,
  interviewId: string,
) => {
  return await prisma.interviewQuestion.findFirst({
    where: {
      id: questionId,
      interviewId: interviewId,
    },
  });
};

//update and save answer , feedback and score
//localhost:5000/api/interviews/InterviewID/questions/questionId/answer
export const saveQuestionAnswerAndFeedback = async (
  questionId: string,
  answer: string,
  feedback: string,
  score: number,
) => {
  return await prisma.interviewQuestion.update({
    where: { id: questionId },
    data: {
      answer,
      feedback,
      score,
    },
  });
};

//retrieve the next question
export const getNextUnansweredQuestion = async (
  interviewId: string,
  currentOrder: number,
) => {
  return await prisma.interviewQuestion.findFirst({
    where: {
      interviewId,
      order: { gt: currentOrder },
    },
    orderBy: { order: "asc" },
  });
};

export const saveFinalEvaluation = async (
  interviewId: string,
  evaluation: FinalEvaluation,
) => {
  return await prisma.evaluation.create({
    data: {
      interviewId,
      score: evaluation.score,
      feedback: evaluation.feedback,
      breakdown: {
        ...evaluation.breakdown,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        recommendation: evaluation.recommendation,
      },
    },
  });
};

//it will verify whether an evaluation already exists before calling Ai
export const getEvaluationByInterviewId = async (interviewId: string) => {
  return await prisma.evaluation.findUnique({
    where: {
      interviewId,
    },
  });
};
