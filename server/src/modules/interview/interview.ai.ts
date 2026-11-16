// server/src/modules/interview/interview.ai.ts
import {
  QuestionEvaluationSchema,
  QuestionEvaluation,
} from "./interviewSchema";
import { analyzeResume } from "../../integrations/ai/aiClient";

export const evaluateQuestionAnswer = async (
  questionText: string,
  candidateAnswer: string,
  roleTitle: string,
  userId?: string,
): Promise<QuestionEvaluation> => {
  const prompt = `
You are an expert technical interviewer evaluating a candidate's answer for the position of "${roleTitle}".

Question Asked: "${questionText}"
Candidate's Answer: "${candidateAnswer}"

Evaluate the candidate's answer and return a JSON object with:
1. "score": An integer from 0 to 100 based on clarity, accuracy, and depth.
2. "feedback": A detailed 2-3 sentence assessment.
3. "strengths": Array of string key strengths demonstrated.
4. "improvements": Array of string suggestions for improvement.

Return ONLY raw JSON conforming to this format without markdown code blocks.
`;

  const rawResponse = await analyzeResume(prompt, "default", {
    userId,
    feature: "INTERVIEW_ANSWER_EVAL",
  });

  const dataToValidate =
    typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;

  return QuestionEvaluationSchema.parse(dataToValidate);
};

export type AdaptiveTriggerType =
  | "VAGUE_ANSWER"
  | "UNSUBSTANTIATED_SKILL_CLAIM"
  | "STRONG_ESCALATION"
  | "CONCEPT_REMEDIATION";

export interface AdaptiveFollowUpPlan {
  trigger: AdaptiveTriggerType;
  badgeLabel: string;
  rationale: string;
  targetSkill: string;
  roundPrefix: string;
}

const buildDeterministicAdaptiveQuestion = (params: {
  plan: AdaptiveFollowUpPlan;
  originalQuestion: string;
  roleTitle: string;
}): string => {
  const { plan, originalQuestion } = params;
  switch (plan.trigger) {
    case "VAGUE_ANSWER":
      return `Follow-up on "${originalQuestion.slice(0, 90)}...": Walk through one concrete production implementation you built using ${plan.targetSkill}. Include the exact architecture, data flow, and one measurable metric or trade-off you handled.`;
    case "UNSUBSTANTIATED_SKILL_CLAIM":
      return `You referenced ${plan.targetSkill} in your response. Explain how ${plan.targetSkill} works under the hood, its core primitives, and a specific scenario where you would deliberately choose an alternative.`;
    case "STRONG_ESCALATION":
      return `Strong foundation on ${plan.targetSkill}. Let's raise the bar for ${params.roleTitle}: how would your design behave at 100x traffic under partial network partitions, stale caches, or cascading downstream timeouts?`;
    case "CONCEPT_REMEDIATION":
      return `Let's break down the core concept behind ${plan.targetSkill} step by step: what problem does it solve, what are its fundamental guarantees, and how would you implement a minimal working example from scratch?`;
  }
};

export const generateAdaptiveFollowUpQuestion = async (params: {
  plan: AdaptiveFollowUpPlan;
  originalQuestion: string;
  candidateAnswer: string;
  roleTitle: string;
  userId?: string;
}): Promise<string> => {
  const directiveMap: Record<AdaptiveTriggerType, string> = {
    VAGUE_ANSWER:
      "The candidate's answer was vague or high-level. Ask a sharp follow-up requiring a concrete production example, specific implementation details, and measurable impact.",
    UNSUBSTANTIATED_SKILL_CLAIM:
      "The candidate claimed familiarity with a technical skill without explaining how it works. Probe the core fundamentals, internal mechanics, and trade-offs of that skill.",
    STRONG_ESCALATION:
      "The candidate gave a strong, accurate answer. Escalate difficulty to senior/staff level—probe distributed edge cases, failure recovery, concurrency, or scale bottlenecks.",
    CONCEPT_REMEDIATION:
      "The candidate struggled with a core concept. Ask a focused, constructive remediation question targeting the exact foundational concept they missed.",
  };

  const prompt = `
You are an adaptive technical interviewer for "${params.roleTitle}".

Previous Question: "${params.originalQuestion}"
Candidate's Answer: "${params.candidateAnswer}"
Target Skill / Topic: "${params.plan.targetSkill}"
Adaptive Directive: ${directiveMap[params.plan.trigger]}

Generate ONE concise, realistic technical follow-up question (2-3 sentences max) that directly builds on the candidate's response.
Return ONLY a raw JSON object: { "question": "..." }
`;

  try {
    const rawResponse = await analyzeResume(prompt, "fast", {
      userId: params.userId,
      feature: "INTERVIEW_GENERATION",
    });
    const parsed =
      typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as Record<string, unknown>).question === "string" &&
      (parsed as Record<string, string>).question.trim().length >= 15
    ) {
      return (parsed as Record<string, string>).question.trim();
    }
  } catch {
    // Fall back to deterministic adaptive prompt if AI is unavailable
  }

  return buildDeterministicAdaptiveQuestion(params);
};
