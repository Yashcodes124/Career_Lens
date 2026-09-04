// server/src/modules/interview/interview.ai.ts
import {
  QuestionEvaluationSchema,
  QuestionEvaluation,
} from "../interviewSchema";
import { analyzeResume } from "../../integrations/ai/aiClient";

export const evaluateQuestionAnswer = async (
  questionText: string,
  candidateAnswer: string,
  roleTitle: string,
): Promise<QuestionEvaluation> => {
  const prompt = `
You are an expert technical interviewer evaluating a candidate's answer for the position of "${roleTitle}".

Question Asked:
"${questionText}"

Candidate's Answer:
"${candidateAnswer}"

Evaluate the candidate's answer and return a JSON object with:
1. "score": An integer from 0 to 100 based on clarity, accuracy, and depth.
2. "feedback": A detailed 2-3 sentence assessment.
3. "strengths": Array of string key strengths demonstrated.
4. "improvements": Array of string suggestions for improvement.

Return ONLY raw JSON conforming to this format without markdown code blocks.
`;

  // Call your LLM service (e.g., Nemotron / OpenAI API wrapper)
  const rawResponse = await analyzeResume(prompt);

  const dataToValidate =
    typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;

  return QuestionEvaluationSchema.parse(dataToValidate);
};
