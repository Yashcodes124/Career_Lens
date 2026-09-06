export type InterviewStatus =
  "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface InterviewRound {
  name: string;
  duration: number;
}

export interface InterviewPlan {
  company: string;
  role: string;
  matchScore: number;
  topSkillGaps: string[];
  estimatedDuration: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  targetSkills: string[];
  rounds: InterviewRound[];
}

export interface InterviewQuestion {
  id: string;
  interviewId: string;
  round: string;
  question: string;
  order: number;
  answer: string | null;
  feedback: string | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationBreakdown {
  communication: number;
  technicalKnowledge: number;
  problemSolving: number;
  relevance: number;
  confidence: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
}

export interface InterviewEvaluation {
  id: string;
  interviewId: string;
  score: number;
  feedback: string;
  breakdown: EvaluationBreakdown;
  createdAt: string;
}

export interface Interview {
  id: string;
  userId: string;
  applicationId: string | null;
  title: string;
  status: InterviewStatus;
  plan: InterviewPlan | null;
  questions: InterviewQuestion[];
  evaluation: InterviewEvaluation | null;
  createdAt: string;
  updatedAt: string;
}

/* API Response Wrappers matching backend data shapes */

export interface CreateInterviewResponse {
  success: boolean;
  message: string;
  data: {
    interview: Interview;
  };
}

export interface GetInterviewResponse {
  success: boolean;
  data: {
    interview: Interview;
  };
}

export interface StartInterviewResponse {
  success: boolean;
  message: string;
  data: {
    interview: Interview;
    firstQuestion: InterviewQuestion;
  };
}

export interface SubmitAnswerData {
  evaluation: {
    score: number;
    feedback: string;
    strengths?: string[];
    improvements?: string[];
  };
  nextQuestion: InterviewQuestion | null;
  completed: boolean;
}

export interface SubmitAnswerResponse {
  success: boolean;
  message: string;
  data: SubmitAnswerData;
}

export interface GenerateEvaluationResponse {
  success: boolean;
  message: string;
  data: {
    evaluation: InterviewEvaluation;
  };
}
