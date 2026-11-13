export type InterviewStatus =
  "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface InterviewRound {
  name: string;
  duration: number;
}

export interface InterviewPlan {
  company: string;
  role: string;
  matchScore: number | null;
  topSkillGaps: string[];
  estimatedDuration: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  targetSkills: string[];
  rounds: InterviewRound[];
}

export interface QuestionFeedbackObject {
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
}

export function parseQuestionFeedback(
  raw: string | QuestionFeedbackObject | null | undefined,
): QuestionFeedbackObject | null {
  if (!raw) return null;
  if (typeof raw === "object") {
    return {
      score: typeof raw.score === "number" ? raw.score : undefined,
      feedback: typeof raw.feedback === "string" ? raw.feedback : undefined,
      strengths: Array.isArray(raw.strengths)
        ? raw.strengths.map(String)
        : undefined,
      improvements: Array.isArray(raw.improvements)
        ? raw.improvements.map(String)
        : undefined,
    };
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        return {
          score: typeof parsed.score === "number" ? parsed.score : undefined,
          feedback: typeof parsed.feedback === "string" ? parsed.feedback : raw,
          strengths: Array.isArray(parsed.strengths)
            ? parsed.strengths.map(String)
            : undefined,
          improvements: Array.isArray(parsed.improvements)
            ? parsed.improvements.map(String)
            : undefined,
        };
      }
    } catch {
      return { feedback: raw };
    }
  }
  return null;
}

export function getQuestionFeedbackText(
  raw: string | QuestionFeedbackObject | null | undefined,
  fallback = "",
): string {
  return parseQuestionFeedback(raw)?.feedback || fallback;
}

export interface InterviewQuestion {
  id: string;
  interviewId: string;
  round: string;
  question: string;
  order: number;
  answer: string | null;
  feedback: string | QuestionFeedbackObject | null;
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

/* API Response Wrappers exactly matching backend controller JSON outputs */

export interface CreateInterviewResponse {
  success: boolean;
  message: string;
  data: Interview; // Controller returns res.status(201).json({ success, message, data: interview })
}

export interface GetInterviewResponse {
  success: boolean;
  message: string;
  data: Interview; // Controller returns res.status(200).json({ success, message, data: interview })
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
