export interface InterviewCustomConfig {
  durationMinutes?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  focusTopics?: string[];
}

export interface InterviewPromptInput {
  job: {
    title: string;
    company: string;
    location?: string | null;
    description: string;
    requirements: string[];
  };
  resume: {
    rawText: string;
    skills: string[];
    experienceYrs: number;
  };
  matchScore: number | null;
  topSkillGaps: string[];
  customConfig?: InterviewCustomConfig;
}

export const buildInterviewPlanPrompt = ({
  job,
  resume,
  matchScore,
  topSkillGaps,
  customConfig,
}: InterviewPromptInput): string => {
  const requestedDuration = customConfig?.durationMinutes ?? 30;
  const requestedDifficulty = customConfig?.difficulty;
  const requestedTopics =
    customConfig?.focusTopics && customConfig.focusTopics.length > 0
      ? customConfig.focusTopics
      : null;

  return `
You are an expert technical interviewer creating a mock interview plan for a candidate.

JOB DETAILS:
Company: ${job.company}
Role: ${job.title}
Location: ${job.location ?? "Not specified"}
Description:
${job.description}

Requirements:
${job.requirements.join(", ")}

CANDIDATE RESUME:
Experience: ${resume.experienceYrs} years
Skills: ${resume.skills.join(", ")}
Resume:
${resume.rawText}

STAGE 5 MATCH RESULT:
Match Score: ${matchScore === null ? "not available (no skills could be compared)" : `${matchScore}/100`}

Top Skill Gaps:
${topSkillGaps.length > 0 ? topSkillGaps.join(", ") : "None identified"}

${
  requestedTopics
    ? `CANDIDATE SELECTED FOCUS SKILLS (STRICTLY PRIORITIZE THESE):
${requestedTopics.join(", ")}`
    : ""
}

TASK:
Create a realistic mock interview plan based on the job, candidate resume,
match score, and identified skill gaps.

The interview should include these rounds:
- Introduction
- Project Deep Dive
- Technical
- Behavioral / HR

${
  requestedDifficulty
    ? `Set the difficulty to "${requestedDifficulty}".`
    : `Set the difficulty appropriately based on the candidate's experience and the job requirements.`
}
Set estimatedDuration to ${requestedDuration} minutes, and make sure the sum of all round durations equals ${requestedDuration} minutes.

OUTPUT REQUIREMENTS:
Return ONLY valid JSON.
Do not include markdown, code fences, explanations, or additional text.

The JSON must match this exact structure:

{
  "company": "string",
  "role": "string",
  "matchScore": 0,
  "topSkillGaps": ["string"],
  "estimatedDuration": ${requestedDuration},
  "difficulty": "${requestedDifficulty || "MEDIUM"}",
  "targetSkills": ["string"],
  "rounds": [
    {
      "name": "Introduction",
      "duration": 5
    }
  ]
}

Rules:
- matchScore must be between 0 and 100.
- estimatedDuration must equal ${requestedDuration}.
- Every round duration must be positive and sum to ${requestedDuration}.
- difficulty must be exactly "EASY", "MEDIUM", or "HARD".
- Do not invent candidate skills that are not supported by the resume.
`;
};
