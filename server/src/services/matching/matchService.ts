import { AppError } from "../../utils/appError";
import { prisma } from "../../config/db";
import { getResumeById } from "../../repositories/resumeRepository";
import { getJobById } from "../../repositories/jobRepository";
import { upsertApplicationMatch } from "../../repositories/matchRepository";
import { listUserSkills } from "../../repositories/skillRepository";
import { countSkillMentions } from "./skillDictionary";
import {
  normalizeSkills,
  evaluateSenioritySkillAlignment,
} from "./skillNormalizer";
import {
  buildScoreDecomposition,
  buildSkillEvidenceAudit,
  calculateMatch,
  calculateTacticalMatrix,
  InterviewEvidence,
  MatchResult,
  ScoreDecomposition,
  SkillEvidenceAuditItem,
  TacticalMatrix,
  simulateMatchImpact,
} from "./matchingService";

export interface MatchResponseData extends MatchResult {
  applicationId: string;
  tactical?: TacticalMatrix | null;
  skillAudit?: SkillEvidenceAuditItem[];
  scoreDecomposition?: ScoreDecomposition | null;
}

const extractFeedbackSummary = (feedback: unknown): string | null => {
  if (!feedback) return null;
  if (typeof feedback === "object") {
    const obj = feedback as Record<string, unknown>;
    if (typeof obj.feedback === "string" && obj.feedback.trim()) {
      return obj.feedback.trim();
    }
  }
  if (typeof feedback === "string") {
    try {
      const parsed = JSON.parse(feedback) as Record<string, unknown>;
      if (parsed && typeof parsed.feedback === "string") {
        return parsed.feedback.trim();
      }
    } catch {
      return feedback.trim();
    }
  }
  return null;
};

const loadQuestionLevelInterviewCitations = async (
  userId: string,
): Promise<{
  strongCitations: Map<string, string>;
  weakCitations: Map<string, string>;
}> => {
  const strongCitations = new Map<string, string>();
  const weakCitations = new Map<string, string>();

  try {
    if (process.env.NODE_ENV === "test" || !prisma?.interview?.findMany) {
      return { strongCitations, weakCitations };
    }

    const interviews = await prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    interviews.forEach((interview, index) => {
      const interviewNum = index + 1;
      for (const q of interview.questions ?? []) {
        if (!q.answer && q.score === null && !q.feedback) continue;
        const feedbackText = extractFeedbackSummary(q.feedback);
        const combinedText = `${q.round} ${q.question} ${q.answer ?? ""} ${feedbackText ?? ""}`;
        const mentionedSkills = [...countSkillMentions(combinedText).keys()];
        if (mentionedSkills.length === 0) continue;

        const scoreLabel =
          typeof q.score === "number" ? ` (${Math.round(q.score)}%)` : "";
        const snippet = feedbackText
          ? feedbackText.length > 120
            ? `${feedbackText.slice(0, 117).trim()}...`
            : feedbackText
          : `Answered "${q.question.slice(0, 80)}..."`;

        const citation = `Interview ${interviewNum}, Q${q.order}${scoreLabel}: ${snippet}`;
        const isStrongScore = (q.score ?? 0) >= 70;

        for (const skill of mentionedSkills) {
          if (isStrongScore) {
            strongCitations.set(skill, citation);
          } else {
            weakCitations.set(skill, citation);
          }
        }
      }
    });
  } catch {
    // Non-fatal fallback in unit tests where prisma.interview is not mocked
  }

  return { strongCitations, weakCitations };
};

export const matchResumeToJob = async (
  userId: string,
  resumeId: string,
  jobId: string,
): Promise<MatchResponseData> => {
  const resume = await getResumeById(resumeId, userId);
  if (!resume) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }

  const job = await getJobById(jobId);
  if (!job || !job.isActive) {
    throw new AppError(404, "Job not found", "JOB_NOT_FOUND");
  }

  const userSkills = await listUserSkills(userId);
  const citations =
    userSkills.length > 0
      ? await loadQuestionLevelInterviewCitations(userId)
      : { strongCitations: new Map(), weakCitations: new Map() };

  const strongMap = new Map<string, string>();
  for (const s of userSkills) {
    if (s.status === "STRONG") {
      strongMap.set(
        s.skill,
        citations.strongCitations.get(s.skill) || s.evidence,
      );
    }
  }

  const weakMap = new Map<string, string>();
  for (const s of userSkills) {
    if (s.status === "WEAK") {
      weakMap.set(s.skill, citations.weakCitations.get(s.skill) || s.evidence);
    }
  }

  const interview: InterviewEvidence = {
    strongSkills: userSkills
      .filter((s) => s.status === "STRONG")
      .map((s) => s.skill),
    weakSkills: weakMap,
    strongCitations: strongMap,
    weakCitations: citations.weakCitations,
  };

  // Normalize with source context so unrecognized tokens populate the review queue
  const normalizedResumeSkills = normalizeSkills(resume.skills, "RESUME_SKILL");
  const normalizedJobRequirements = normalizeSkills(
    job.requirements,
    "JOB_REQUIREMENT",
  );

  const result = calculateMatch(
    normalizedResumeSkills,
    normalizedJobRequirements,
    job.description,
    interview,
  );

  const seniorityAssessment = evaluateSenioritySkillAlignment({
    jobTitle: job.title,
    jobDescription: job.description,
    candidateExperienceYrs:
      (resume as { experienceYrs?: number | null }).experienceYrs ?? null,
    requiredSkills: normalizedJobRequirements,
    matchedSkills: result.matchedSkills,
  });

  const enrichedResult: MatchResult = {
    ...result,
    seniorityAssessment,
  };

  const tactical = calculateTacticalMatrix(
    resume.skills,
    job.requirements,
    job.description,
    interview,
  );

  const skillAudit = buildSkillEvidenceAudit({
    resumeSkills: resume.skills,
    resumeRawText: (resume as { rawText?: string | null }).rawText ?? null,
    resumeParsedData: (resume as { parsedData?: unknown }).parsedData ?? null,
    jobSkills: job.requirements,
    jobDescription: job.description,
    interview,
  });

  const scoreDecomposition = buildScoreDecomposition({
    match: enrichedResult,
    skillAudit,
    candidateExperienceYrs:
      (resume as { experienceYrs?: number | null }).experienceYrs ?? null,
    jobTitle: job.title,
    jobDescription: job.description,
  });

  const application = await upsertApplicationMatch(userId, jobId, {
    matchScore: enrichedResult.score,
    skillGaps: enrichedResult.skillGaps.map((gap) => gap.skill),
  });

  return {
    ...enrichedResult,
    applicationId: application.id,
    tactical,
    skillAudit,
    scoreDecomposition,
  };
};

export const simulateJobMatchImpactService = async (
  userId: string,
  resumeId: string,
  jobId: string,
  selectedSkills: string[],
) => {
  const resume = await getResumeById(resumeId, userId);
  if (!resume) {
    throw new AppError(404, "Resume not found", "RESUME_NOT_FOUND");
  }

  const job = await getJobById(jobId);
  if (!job || !job.isActive) {
    throw new AppError(404, "Job not found", "JOB_NOT_FOUND");
  }

  const [userSkills, activeJobs] = await Promise.all([
    listUserSkills(userId),
    prisma.job?.findMany
      ? prisma.job.findMany({
          where: { isActive: true },
          take: 250,
          select: { requirements: true },
        })
      : Promise.resolve([]),
  ]);

  const interview: InterviewEvidence = {
    strongSkills: userSkills
      .filter((s) => s.status === "STRONG")
      .map((s) => s.skill),
    weakSkills: new Map(
      userSkills
        .filter((s) => s.status === "WEAK")
        .map((s) => [s.skill, s.evidence] as const),
    ),
  };

  return simulateMatchImpact({
    resumeSkills: resume.skills,
    resumeRawText: (resume as { rawText?: string | null }).rawText ?? null,
    resumeParsedData: (resume as { parsedData?: unknown }).parsedData ?? null,
    jobSkills: job.requirements,
    jobTitle: job.title,
    jobDescription: job.description,
    candidateExperienceYrs:
      (resume as { experienceYrs?: number | null }).experienceYrs ?? null,
    interview,
    selectedMissingSkills: selectedSkills,
    activeCatalogJobSkills: activeJobs.map((j) => j.requirements),
  });
};
