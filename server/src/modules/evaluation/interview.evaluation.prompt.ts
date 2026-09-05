//server/src/modules/interview/interview.evaluation.prompt.ts

export interface FinalEvaluationPromptInput {
  jobTitle: string;
  companyName: string;
  roleDescription?: string;
  matchScore: number;
  skillGaps: string[];
  interviewPlan?: {
    focusArea?: string;
    totalQuestions?: number;
  };
  questions: Array<{
    order: number;
    round: string;
    question: string;
    answer: string | null;
    score: number | null;
    feedback: string | null;
  }>;
}

export const buildFinalEvaluationPrompt = (
  data: FinalEvaluationPromptInput,
): string => {
  const formattedQuestions = data.questions
    .map(
      (q) => `
- Question ${q.order} [Round: ${q.round}]:
  * Prompt: "${q.question}"
  * Candidate Answer: "${q.answer || "No answer provided"}"
  * Per-Question Score: ${q.score ?? "N/A"}/100
  * Per-Question Feedback: ${q.feedback || "None"}`,
    )
    .join("\n");

  return `
You are an expert technical interviewer and hiring manager. Perform a holistic, comprehensive final evaluation of the candidate's full interview session.

### Position & Application Context:
- Target Role: ${data.jobTitle}
- Company: ${data.companyName}
${data.roleDescription ? `- Role Description: ${data.roleDescription}` : ""}
- Candidate Resume Match Score: ${data.matchScore}%
- Identified Skill Gaps: ${
    data.skillGaps.length > 0 ? data.skillGaps.join(", ") : "None"
  }

### Interview Plan Details:
${
  data.interviewPlan?.focusArea
    ? `- Focus Area: ${data.interviewPlan.focusArea}`
    : ""
}
- Total Questions Planned: ${
    data.interviewPlan?.totalQuestions ?? data.questions.length
  }

### Complete Interview Transcript & Scores:
${formattedQuestions}

### Task Instructions:
1. Conduct an overall evaluation of the candidate's performance across technical capabilities, communication, problem-solving, and role alignment.
2. Do NOT simply calculate a mathematical average of the individual question scores. Evaluate performance holistically.
3. Construct detailed feedback highlighting overarching strengths and clear actionable areas for improvement.

### Required Output Format:
Return ONLY a valid, raw JSON object matching this structure (no Markdown backticks, no explanatory prose):

{
  "score": <overall_score_0_to_100>,
  "feedback": "<detailed_overall_performance_summary>",
  "breakdown": {
    "communication": <score_0_to_100>,
    "technicalKnowledge": <score_0_to_100>,
    "problemSolving": <score_0_to_100>,
    "relevance": <score_0_to_100>,
    "confidence": <score_0_to_100>
  },
  "strengths": ["<strength_1>", "<strength_2>"],
  "improvements": ["<improvement_1>", "<improvement_2>"],
  "recommendation": "<Strong Hire | Hire | Weak Hire | Do Not Hire with brief justification>"
}
`.trim();
};
