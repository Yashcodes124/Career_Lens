// server/src/modules/interview/interview.prompt.ts

// Job details
// +
// Resume data
// +
// Stage 5 match score
// +
// Top skill gaps

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
  matchScore: number;
  topSkillGaps: string[];
}

export const buildInterviewPlanPrompt = ({
  job,
  resume,
  matchScore,
  topSkillGaps,
}: InterviewPromptInput): string => {
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
Match Score: ${matchScore}/100

Top Skill Gaps:
${topSkillGaps.length > 0 ? topSkillGaps.join(", ") : "None identified"}

TASK:
Create a realistic mock interview plan based on the job, candidate resume,
match score, and identified skill gaps.

The interview should include these rounds:
- Introduction
- Project Deep Dive
- Technical
- Behavioral / HR

Set the difficulty appropriately based on the candidate's experience and
the job requirements. Target skills should prioritize the most relevant
job skills and the candidate's skill gaps.

OUTPUT REQUIREMENTS:
Return ONLY valid JSON.
Do not include markdown, code fences, explanations, or additional text.

The JSON must match this exact structure:

{
  "company": "string",
  "role": "string",
  "matchScore": 0,
  "topSkillGaps": ["string"],
  "estimatedDuration": 30,
  "difficulty": "EASY",
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
- estimatedDuration must be a positive number in minutes.
- Every round duration must be positive.
- difficulty must be exactly "EASY", "MEDIUM", or "HARD".
- Include all four required interview rounds.
- Do not invent candidate skills that are not supported by the resume.
`;
};
