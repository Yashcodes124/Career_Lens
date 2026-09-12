import { apiClient } from "@/lib/api-client";
import {
  Interview,
  InterviewEvaluation,
  CreateInterviewResponse,
  GetInterviewResponse,
  StartInterviewResponse,
  SubmitAnswerResponse,
  SubmitAnswerData,
  GenerateEvaluationResponse,
} from "./types";

//created this , to pass the optional fields
export interface CreateInterviewOptions {
  applicationId: string;
  durationMinutes?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  focusTopics?: string[];
}

export async function createInterview(
  options: CreateInterviewOptions,
): Promise<Interview> {
  const response = await apiClient<CreateInterviewResponse>("/interviews", {
    method: "POST",
    body: JSON.stringify(options),
  });
  return response.data;
}

export async function fetchInterviewById(
  interviewId: string,
): Promise<Interview> {
  const response = await apiClient<GetInterviewResponse>(
    `/interviews/${interviewId}`,
    {
      method: "GET",
    },
  );
  return response.data;
}

export async function startInterview(
  interviewId: string,
): Promise<{ interview: Interview; firstQuestion: Interview["questions"][0] }> {
  const response = await apiClient<StartInterviewResponse>(
    `/interviews/${interviewId}/start`,
    {
      method: "POST",
    },
  );
  return response.data;
}

export async function submitInterviewAnswer(
  interviewId: string,
  questionId: string,
  answer: string,
): Promise<SubmitAnswerData> {
  const response = await apiClient<SubmitAnswerResponse>(
    `/interviews/${interviewId}/questions/${questionId}/answer`,
    {
      method: "POST",
      body: JSON.stringify({ answer }),
    },
  );
  return response.data;
}

export async function generateInterviewEvaluation(
  interviewId: string,
): Promise<InterviewEvaluation> {
  const response = await apiClient<GenerateEvaluationResponse>(
    `/interviews/${interviewId}/evaluation`,
    {
      method: "POST",
    },
  );
  return response.data.evaluation;
}
