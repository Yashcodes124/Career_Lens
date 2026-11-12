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

export interface SelectableInterviewRound {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
}

export const INTERVIEW_ROUND_CATALOG: SelectableInterviewRound[] = [
  {
    id: "intro",
    name: "Introduction & Role Fit",
    shortLabel: "Intro & Role Fit",
    description:
      "Background summary, engineering motivation, and alignment with the target role.",
  },
  {
    id: "project_dive",
    name: "Project & Resume Deep-Dive",
    shortLabel: "Project Deep-Dive",
    description:
      "Architecture, technical ownership, and trade-offs in your resume projects.",
  },
  {
    id: "core_technical",
    name: "Core Technical & Stack Assessment",
    shortLabel: "Core Technical",
    description:
      "Direct technical questions on your selected focus skills and role stack.",
  },
  {
    id: "system_design",
    name: "System Design & Architecture",
    shortLabel: "System Design",
    description:
      "Scalability, APIs, database schema design, caching, and distributed systems.",
  },
  {
    id: "debugging",
    name: "Debugging & Production Scenarios",
    shortLabel: "Debugging & Incidents",
    description:
      "Root-cause analysis, latency bottlenecks, concurrency, and failure recovery.",
  },
  {
    id: "problem_solving",
    name: "Problem Solving & Data Structures",
    shortLabel: "Problem Solving / DSA",
    description:
      "Algorithmic reasoning, edge cases, and time/space complexity trade-offs.",
  },
  {
    id: "behavioral",
    name: "Behavioral & Engineering Ownership",
    shortLabel: "Behavioral & Ownership",
    description:
      "Cross-team collaboration, ambiguity, code quality, and delivery under pressure.",
  },
];

export interface CreateInterviewOptions {
  applicationId: string;
  durationMinutes?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  focusTopics?: string[];
  selectedRounds?: string[];
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

export async function fetchUserInterviews(): Promise<Interview[]> {
  const response = await apiClient<{ success: boolean; data: Interview[] }>(
    "/interviews",
    { method: "GET" },
  );
  return response.data ?? [];
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
