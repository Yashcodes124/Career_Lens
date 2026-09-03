//server/src/modules/interview/interview.question.prompt.ts

import { InterviewPlan } from "../interviewSchema";

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
  matchScore: number;
  topSkillGaps: string[];
}

export const buildInterviewQuestionsPrompt = (
  input: InterviewQuestionPromptInput,
): string => {
  const { plan, job, resume, matchScore, topSkillGaps } = input;

  return `
You are an expert technical interviewer conducting an interview for the position of **${job.title}** at **${job.company}**.

### CANDIDATE & JOB CONTEXT
- **Target Role:** ${job.title} at ${job.company}
- **Interview Difficulty:** ${plan.difficulty}
- **Match Score:** ${matchScore}%
- **Target Skills:** ${plan.targetSkills.join(", ")}
- **Identified Skill Gaps:** ${topSkillGaps.length > 0 ? topSkillGaps.join(", ") : "None specified"}
- **Job Requirements:** ${
    Array.isArray(job.requirements)
      ? job.requirements.join(", ")
      : job.requirements || "Not provided"
  }

### RESUME CONTEXT
- **Years of Experience:** ${resume.experienceYrs ?? "Not specified"}
- **Resume Skills:** ${resume.skills?.join(", ") ?? "Not specified"}
- **Resume Content Summary:**
${resume.rawText.slice(0, 2000)}

### REQUIRED INTERVIEW ROUNDS
Generate customized, relevant interview questions for each of the following rounds defined in the interview plan:
${plan.rounds.map((r) => `- **${r.name}** (${r.duration} mins)`).join("\n")}

### RULES FOR QUESTION GENERATION
1. **Relevance:** Tailor questions directly to the candidate's experience level, the job specifications, and target company.
2. **Project Deep Dive:** Create questions based explicitly on projects, experience, or achievements mentioned in the resume.
3. **Technical Round:** Probe target skills and explicitly test areas marked as skill gaps to evaluate depth.
4. **Behavioral / HR Round:** Focus on leadership, cross-functional collaboration, problem-solving, and adaptability suitable for the difficulty level (${plan.difficulty}).
5. **Ordering:** Assign sequential 1-based integer values for the \`order\` property across all generated questions.

### OUTPUT FORMAT
Return strictly valid JSON with no markdown formatting around it, matching this schema:
{
  "questions": [
    {
      "round": "Introduction",
      "question": "Question text here...",
      "order": 1
    },
    {
      "round": "Project Deep Dive",
      "question": "Question text here...",
      "order": 2
    }
  ]
}
`.trim();
};
