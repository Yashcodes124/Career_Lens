// Suggests skills-list changes for one resume and one job.
// Deterministic and traceable: a suggestion to add a skill is made only when the
// resume text already mentions it. Skills the resume never mentions are listed
// as gaps, and nothing is ever added on the candidate's behalf.
import { AppError } from "../../utils/appError";
import { getResumeById } from "../../repositories/resumeRepository";
import { getJobById } from "../../repositories/jobRepository";
import { countSkillMentions } from "../matching/skillDictionary";
import { normalizeSkills } from "../matching/skillNormalizer";
import type { GapPriority } from "../matching/matchingService";

export interface AddSuggestion {
  skill: string;
  evidence: string;
}

export interface MissingSuggestion {
  skill: string;
  priority: GapPriority;
  evidence: string;
}

export interface TailoringSuggestions {
  jobTitle: string;
  currentSkills: string[];
  addToSkills: AddSuggestion[];
  notOnResume: MissingSuggestion[];
  suggestedSkills: string[];
}

const PRIORITY_ORDER: Record<GapPriority, number> = { high: 0, medium: 1, low: 2 };

const priorityFromMentions = (mentions: number): GapPriority => {
  if (mentions >= 3) return "high";
  if (mentions === 2) return "medium";
  return "low";
};

const times = (count: number) => (count === 1 ? "time" : "times");

export const buildTailoringSuggestions = (
  resume: { skills: string[]; rawText: string },
  job: { title: string; requirements: string[]; description: string },
): TailoringSuggestions => {
  const listed = new Set(normalizeSkills(resume.skills));
  const required = normalizeSkills(job.requirements);
  const inResumeText = countSkillMentions(resume.rawText);
  const inJobPosting = countSkillMentions(job.description);

  const addToSkills: AddSuggestion[] = [];
  const notOnResume: MissingSuggestion[] = [];

  for (const skill of required) {
    if (listed.has(skill)) continue;

    const textCount = inResumeText.get(skill) ?? 0;
    if (textCount > 0) {
      addToSkills.push({
        skill,
        evidence: `Your resume text mentions ${skill} ${textCount} ${times(textCount)}, but your skills list does not`,
      });
      continue;
    }

    const postingCount = inJobPosting.get(skill) ?? 0;
    notOnResume.push({
      skill,
      priority: priorityFromMentions(postingCount),
      evidence:
        postingCount > 0
          ? `Named ${postingCount} ${times(postingCount)} in the job description`
          : "Listed in the job requirements",
    });
  }

  notOnResume.sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.skill.localeCompare(b.skill),
  );

  const seen = new Set<string>();
  const suggestedSkills: string[] = [];
  for (const skill of [...resume.skills.map((s) => s.trim()), ...addToSkills.map((s) => s.skill)]) {
    const key = skill.toLowerCase();
    if (skill && !seen.has(key)) {
      seen.add(key);
      suggestedSkills.push(skill);
    }
  }

  return {
    jobTitle: job.title,
    currentSkills: resume.skills,
    addToSkills,
    notOnResume,
    suggestedSkills,
  };
};

export const tailorResumeService = async (
  userId: string,
  resumeId: string,
  jobId: string,
): Promise<TailoringSuggestions> => {
  const resume = await getResumeById(resumeId, userId);
  if (!resume) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }

  const job = await getJobById(jobId);
  if (!job || !job.isActive) {
    throw new AppError(404, "Job not found", "JOB_NOT_FOUND");
  }

  return buildTailoringSuggestions(
    { skills: resume.skills, rawText: resume.rawText },
    { title: job.title, requirements: job.requirements, description: job.description },
  );
};
