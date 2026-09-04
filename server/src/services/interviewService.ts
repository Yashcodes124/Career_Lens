//server/src/modules/interview/interview.service.ts

import { prisma } from "../config/db";
import { analyzeResume } from "../integrations/ai/aiClient";
import {
  buildInterviewPlanPrompt,
  InterviewPromptInput,
} from "../modules/interview.prompt";
import {
  InterviewPlanSchema,
  InterviewPlan,
  InterviewQuestions,
  InterviewQuestionsSchema,
} from "../modules/interviewSchema";
import {
  createInterview,
  createInterviewQuestions,
  getInterviewSessionById,
  updateInterviewStatus,
} from "../modules/interviewRepository";
import {
  buildInterviewQuestionsPrompt,
  InterviewQuestionPromptInput,
} from "../modules/interview/interview.question.prompt";

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
  const validatedPlan = InterviewPlanSchema.parse(jsonContent);

  return validatedPlan;
};

export const createInterviewService = async (
  userId: string,
  applicationId: string,
) => {
  //fetch the application
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId: userId,
    },
    include: {
      job: true,
    },
  });
  if (!application || !application.job) {
    throw new Error("Application or Associated job not found");
  }
  //get stage 5 metrices
  const matchScore = application.matchScore ?? 0;
  const topSkillGaps = application.skillGaps ?? [];

  //get the users resume
  const resume = await prisma.resume.findFirst({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  if (!resume) {
    throw new Error("User resume not found.");
  }

  //prepare the interview plan
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

  const plan = await generateInterviewPlan(promptInput);

  const title = `${application.job.title} at ${application.job.company}`;

  const interview = await createInterview({
    userId,
    applicationId,
    title,
    plan,
  });

  // 5. Generate Interview Questions using the generated plan
  const questionPromptInput = {
    plan,
    job: application.job,
    resume,
    matchScore,
    topSkillGaps,
  };
  const generatedQuestions =
    await generateInterviewQuestions(questionPromptInput);

  // 6. Save Questions to DB
  await createInterviewQuestions(interview.id, generatedQuestions.questions);

  // 7. Fetch and return full interview record with questions included
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
