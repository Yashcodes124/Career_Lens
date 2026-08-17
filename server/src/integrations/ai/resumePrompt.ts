export const buildResumeAnalysisPrompt = (resumeText: string) => `
You are a resume parsing system.

Analyze the following resume and return ONLY valid JSON.

Do not invent information.
If information is missing, use:
- "" for missing strings
- [] for missing arrays
- null for unknown numbers

Return exactly this structure:

{
  "summary": "",
  "skills": [],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "startYear": null,
      "endYear": null
    }
  ],
  "experience": [
    {
      "company": "",
      "role": "",
      "description": "",
      "durationMonths": null
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": []
    }
  ],
  "totalExperienceYears": 0
}

Important:
- Extract only information explicitly present in the resume.
- Do not infer employment or education details.
- Keep skills as concise technology/skill names.
- Do not include markdown.
- Do not wrap the JSON in \`\`\` blocks.

RESUME:
${resumeText}
`;
