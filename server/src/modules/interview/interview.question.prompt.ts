import { InterviewPlan } from "./interviewSchema";

export interface InterviewQuestionPromptInput {
  plan: InterviewPlan;
  job: {
    title: string;
    company: string;
    description?: string | null;
    requirements?: string[] | string | null;
  };
  resume: {
    rawText: string;
    skills?: string[] | null;
    experienceYrs?: number | null;
  };
  matchScore: number | null;
  topSkillGaps: string[];
  questionCount?: number;
  strictSkillFocus?: boolean;
}

export const buildInterviewQuestionsPrompt = (
  input: InterviewQuestionPromptInput,
): string => {
  const {
    plan,
    job,
    resume,
    matchScore,
    topSkillGaps,
    questionCount,
    strictSkillFocus,
  } = input;

  const targetTotalQuestions =
    questionCount ??
    (plan.estimatedDuration <= 15
      ? 4
      : plan.estimatedDuration <= 30
        ? 5
        : plan.estimatedDuration <= 45
          ? 7
          : 8);

  return `
You are an expert technical interviewer conducting a ${plan.difficulty} level interview for **${job.title}** at **${job.company}**.

### CANDIDATE & SESSION CONFIGURATION
- **Target Role:** ${job.title} at ${job.company}
- **Difficulty Level:** ${plan.difficulty}
- **Total Duration:** ${plan.estimatedDuration} minutes
- **Exact Number of Questions to Generate:** ${targetTotalQuestions} questions total
- **Selected Skills to Test:** ${plan.targetSkills.join(", ")}
- **Skill Gaps:** ${topSkillGaps.length > 0 ? topSkillGaps.join(", ") : "None specified"}
- **Match Score:** ${matchScore === null ? "not available" : `${matchScore}%`}

### RESUME SUMMARY
- **Experience:** ${resume.experienceYrs ?? 0} years
- **Candidate Skills:** ${resume.skills?.join(", ") ?? "Not specified"}
- **Excerpt:**
${resume.rawText.slice(0, 1400)}

### INTERVIEW ROUNDS TO COVER
${plan.rounds.map((r) => `- **${r.name}** (${r.duration} mins)`).join("\n")}

### STRICT QUESTION GENERATION RULES
1. **Exact Count:** Generate EXACTLY ${targetTotalQuestions} questions in total across the listed rounds. Do NOT generate more than ${targetTotalQuestions} questions.
2. **Skill Focus:** ${
    strictSkillFocus
      ? `The candidate specifically chose to practice [${plan.targetSkills.join(", ")}]. Every technical/practical question MUST directly test [${plan.targetSkills.join(", ")}] at an ${plan.difficulty} difficulty level. Do NOT ask generic "walk me through your computer science journey" questions.`
      : `Tailor questions to the target skills (${plan.targetSkills.join(", ")}) and candidate resume.`
  }
3. **Difficulty Calibration (${plan.difficulty}):**
   - If EASY: Focus on core definitions, fundamental usage, and basic scenarios.
   - If MEDIUM: Focus on real-world implementation, debugging, and API/query design.
   - If HARD: Focus on edge cases, performance bottlenecks, concurrency, and architecture trade-offs.
4. **Sequential Order:** Number \`order\` sequentially from 1 to ${targetTotalQuestions}.

### OUTPUT FORMAT
Return strictly valid raw JSON with no markdown fences:
{
  "questions": [
    {
      "round": "${plan.rounds[0]?.name || "Skill Assessment"}",
      "question": "Direct, specific question text...",
      "order": 1
    }
  ]
}
`.trim();
};
