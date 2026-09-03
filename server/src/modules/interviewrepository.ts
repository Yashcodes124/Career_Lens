// server/src/modules/interview/interview.repository.ts

import { prisma } from "../config/db";
import { InterviewQuestion } from "./interviewSchema";

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
