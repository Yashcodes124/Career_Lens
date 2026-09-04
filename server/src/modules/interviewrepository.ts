// server/src/modules/interview/interview.repository.ts

import { prisma } from "../config/db";
import { InterviewQuestion } from "./interviewSchema";

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
