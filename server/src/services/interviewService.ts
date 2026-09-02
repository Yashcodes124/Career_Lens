//server/src/modules/interview/interview.service.ts

import { prisma } from "../config/db";
import { analyzeResume } from "../integrations/ai/aiClient";
import {
  buildInterviewPlanPrompt,
  InterviewPromptInput,
} from "../modules/interview.prompt";
import { InterviewPlanSchema, InterviewPlan } from "../modules/interviewSchema";
import { createInterview } from "../modules/interviewrepository";

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
  return interview;
};
