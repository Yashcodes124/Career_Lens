//evaluates all active jobs against the candidate's active resume and UserSkill interview evidence (STRONG vs. WEAK) in
// a single pass—without calling an LLM—and classifies opportunities into the 5 strategic radar buckets

import { prisma } from "../../config/db";
import { listUserSkills } from "../../repositories/skillRepository";
import { recordFeatureEvent } from "../telemetry/telemetryService";
import { calculateMatch, type InterviewEvidence } from "./matchingService";
import { normalizeSkills } from "./skillNormalizer";
import { extractJobSkills } from "./jobSkillExtractor";

export interface RadarJobOpportunity {
  jobId: string;
  title: string;
  company: string;
  location: string | null;
  source: string;
  url: string | null;
  salaryRange: string | null;
  lastSyncedAt: string;
  applicationStatus: string | null;
  isSaved: boolean;

  // Core scores
  resumeOnlyScore: number;
  verifiedScore: number;
  evidenceDeltaPct: number;
  requiredCount: number;
  matchedCount: number;
  verifiedMatchedCount: number;
  unvalidatedMatchedCount: number;
  missingCount: number;

  // Skill lists
  matchedSkills: string[];
  verifiedSkillsUsed: string[];
  unvalidatedSkillsUsed: string[];
  weakSkillsPenalized: string[];
  missingSkills: string[];

  // Strategic levers
  topUnlockSkill: string | null;
  singleSkillGainPct: number;
  projectedScoreWithOneSkill: number;
  strategicReason: string;
  recommendedAction: string;
}

export interface RoleFitRadarResult {
  hasResume: boolean;
  resume: {
    id: string;
    title: string;
    fileName: string | null;
    skillsCount: number;
    experienceYrs: number;
  } | null;
  summary: {
    totalActiveJobsEvaluated: number;
    bestFitCount: number;
    oneSkillBreakoutCount: number;
    evidenceShiftedCount: number;
    needsValidationCount: number;
    deprioritizedCount: number;
  };
  buckets: {
    topBestFit: RadarJobOpportunity[];
    oneSkillBreakouts: RadarJobOpportunity[];
    evidenceShifted: RadarJobOpportunity[];
    needsValidation: RadarJobOpportunity[];
    deprioritized: RadarJobOpportunity[];
  };
}

export interface RadarJobInput {
  id: string;
  title: string;
  company: string;
  location: string | null;
  source: string;
  url: string | null;
  salaryRange: string | null;
  lastSyncedAt: Date | string;
  requirements: string[];
  description: string;
}

/**
 * Pure deterministic Role-Fit Radar classifier.
 * Evaluates active jobs across 5 strategic decision buckets.
 */
export const buildRoleFitRadar = (params: {
  resumeSkills: string[];
  userSkills: Array<{
    skill: string;
    status: "STRONG" | "WEAK";
    evidence: string;
  }>;
  jobs: RadarJobInput[];
  applicationsByJobId?: Map<string, string>;
  savedJobIds?: Set<string>;
}): Omit<RoleFitRadarResult, "hasResume" | "resume"> => {
  const strongSkills = params.userSkills
    .filter((s) => s.status === "STRONG")
    .map((s) => s.skill);
  const weakSkillsMap = new Map<string, string>(
    params.userSkills
      .filter((s) => s.status === "WEAK")
      .map((s) => [s.skill, s.evidence] as const),
  );

  const normalizedStrongSet = new Set(normalizeSkills(strongSkills));
  const normalizedWeakSet = new Set(normalizeSkills([...weakSkillsMap.keys()]));

  const interviewEvidence: InterviewEvidence = {
    strongSkills,
    weakSkills: weakSkillsMap,
  };

  const evaluated: RadarJobOpportunity[] = [];

  for (const job of params.jobs) {
    const effectiveRequirements =
      job.requirements && job.requirements.length > 0
        ? job.requirements
        : extractJobSkills(job.description ?? "");

    const requiredNormalized = normalizeSkills(effectiveRequirements);
    if (requiredNormalized.length === 0) {
      // Never guess scores on INSUFFICIENT_DATA postings
      continue;
    }

    const baselineMatch = calculateMatch(
      params.resumeSkills,
      effectiveRequirements,
      job.description,
    );
    const verifiedMatch = calculateMatch(
      params.resumeSkills,
      effectiveRequirements,
      job.description,
      interviewEvidence,
    );

    if (
      baselineMatch.status !== "OK" ||
      baselineMatch.score === null ||
      verifiedMatch.status !== "OK" ||
      verifiedMatch.score === null
    ) {
      continue;
    }

    const resumeOnlyScore = baselineMatch.score;
    const verifiedScore = verifiedMatch.score;
    const evidenceDeltaPct = verifiedScore - resumeOnlyScore;

    const verifiedSkillsUsed = verifiedMatch.matchedSkills.filter((sk) =>
      normalizedStrongSet.has(sk),
    );
    const unvalidatedSkillsUsed = verifiedMatch.matchedSkills.filter(
      (sk) => !normalizedStrongSet.has(sk),
    );
    const weakSkillsPenalized = requiredNormalized.filter((sk) =>
      normalizedWeakSet.has(sk),
    );

    const requiredCount = requiredNormalized.length;
    const matchedCount = verifiedMatch.matchedSkills.length;
    const missingCount = verifiedMatch.missingSkills.length;

    // Top 1 skill unlock simulation (highest priority missing/weak skill)
    const topUnlockSkill = verifiedMatch.skillGaps[0]?.skill ?? null;
    const projectedScoreWithOneSkill = topUnlockSkill
      ? Math.min(100, Math.round(((matchedCount + 1) / requiredCount) * 100))
      : verifiedScore;
    const singleSkillGainPct = Math.max(
      0,
      projectedScoreWithOneSkill - verifiedScore,
    );

    const applicationStatus = params.applicationsByJobId?.get(job.id) ?? null;
    const isSaved = params.savedJobIds?.has(job.id) ?? false;

    let strategicReason = `Meets ${matchedCount} of ${requiredCount} requirements (${verifiedSkillsUsed.length} interview-verified).`;
    let recommendedAction = "Inspect full evidence breakdown";

    if (evidenceDeltaPct > 0) {
      strategicReason = `Interview proof boosted match from ${resumeOnlyScore}% → ${verifiedScore}% (+${evidenceDeltaPct}%) via verified ${verifiedSkillsUsed.slice(0, 2).join(", ")}.`;
      recommendedAction = "Apply with verified skill proof";
    } else if (evidenceDeltaPct < 0) {
      strategicReason = `Exposed gap in ${weakSkillsPenalized.join(", ")} lowered match from ${resumeOnlyScore}% → ${verifiedScore}% (${evidenceDeltaPct}%).`;
      recommendedAction = `Re-verify ${weakSkillsPenalized[0] ?? "weak skill"}`;
    } else if (topUnlockSkill && singleSkillGainPct >= 10) {
      strategicReason = `Adding ${topUnlockSkill} jumps your fit from ${verifiedScore}% → ${projectedScoreWithOneSkill}% (+${singleSkillGainPct}%).`;
      recommendedAction = `Close ${topUnlockSkill} gap`;
    } else if (verifiedScore >= 65 && unvalidatedSkillsUsed.length > 0) {
      strategicReason = `${verifiedScore}% paper match, but ${unvalidatedSkillsUsed.length} of ${matchedCount} matched skills have zero interview proof.`;
      recommendedAction = `Validate ${unvalidatedSkillsUsed[0]}`;
    } else if (verifiedScore < 40) {
      strategicReason = `Only ${matchedCount} of ${requiredCount} requirements met (${missingCount} missing gaps) — low short-term ROI.`;
      recommendedAction = "Deprioritize for now";
    }

    evaluated.push({
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      source: job.source,
      url: job.url,
      salaryRange: job.salaryRange,
      lastSyncedAt:
        job.lastSyncedAt instanceof Date
          ? job.lastSyncedAt.toISOString()
          : String(job.lastSyncedAt),
      applicationStatus,
      isSaved,
      resumeOnlyScore,
      verifiedScore,
      evidenceDeltaPct,
      requiredCount,
      matchedCount,
      verifiedMatchedCount: verifiedSkillsUsed.length,
      unvalidatedMatchedCount: unvalidatedSkillsUsed.length,
      missingCount,
      matchedSkills: verifiedMatch.matchedSkills,
      verifiedSkillsUsed,
      unvalidatedSkillsUsed,
      weakSkillsPenalized,
      missingSkills: verifiedMatch.missingSkills,
      topUnlockSkill,
      singleSkillGainPct,
      projectedScoreWithOneSkill,
      strategicReason,
      recommendedAction,
    });
  }

  // 1. Top 10 best-fit active roles
  const topBestFit = [...evaluated]
    .filter((j) => j.verifiedScore >= 50)
    .sort(
      (a, b) =>
        b.verifiedScore - a.verifiedScore ||
        b.verifiedMatchedCount - a.verifiedMatchedCount ||
        a.missingCount - b.missingCount,
    )
    .slice(0, 10);

  // 2. Roles where one skill addition creates a major improvement (>= +10% gain or crosses >= 70% threshold)
  const oneSkillBreakouts = [...evaluated]
    .filter(
      (j) =>
        j.topUnlockSkill !== null &&
        j.verifiedScore < 95 &&
        (j.singleSkillGainPct >= 10 ||
          (j.verifiedScore < 70 && j.projectedScoreWithOneSkill >= 70)),
    )
    .sort(
      (a, b) =>
        b.projectedScoreWithOneSkill - a.projectedScoreWithOneSkill ||
        b.singleSkillGainPct - a.singleSkillGainPct,
    )
    .slice(0, 12);

  // 3. Roles where interview evidence changes the result (either boosted by STRONG or penalized by WEAK)
  const evidenceShifted = [...evaluated]
    .filter((j) => j.evidenceDeltaPct !== 0)
    .sort(
      (a, b) =>
        Math.abs(b.evidenceDeltaPct) - Math.abs(a.evidenceDeltaPct) ||
        b.verifiedScore - a.verifiedScore,
    )
    .slice(0, 12);

  // 4. Roles where the user is already strong (>= 65%) but needs interview validation
  const needsValidation = [...evaluated]
    .filter(
      (j) =>
        j.verifiedScore >= 65 &&
        j.unvalidatedMatchedCount > 0 &&
        j.unvalidatedMatchedCount >= j.verifiedMatchedCount,
    )
    .sort(
      (a, b) =>
        b.verifiedScore - a.verifiedScore ||
        b.unvalidatedMatchedCount - a.unvalidatedMatchedCount,
    )
    .slice(0, 12);

  // 5. Roles that are poor fits and should be deprioritized (< 40% verified score & < 50% even with +1 skill)
  const deprioritized = [...evaluated]
    .filter((j) => j.verifiedScore < 40 && j.projectedScoreWithOneSkill < 50)
    .sort(
      (a, b) =>
        a.verifiedScore - b.verifiedScore || b.missingCount - a.missingCount,
    )
    .slice(0, 12);

  return {
    summary: {
      totalActiveJobsEvaluated: evaluated.length,
      bestFitCount: topBestFit.length,
      oneSkillBreakoutCount: oneSkillBreakouts.length,
      evidenceShiftedCount: evidenceShifted.length,
      needsValidationCount: needsValidation.length,
      deprioritizedCount: deprioritized.length,
    },
    buckets: {
      topBestFit,
      oneSkillBreakouts,
      evidenceShifted,
      needsValidation,
      deprioritized,
    },
  };
};

export const getRoleFitRadarService = async (
  userId: string,
  resumeId?: string,
): Promise<RoleFitRadarResult> => {
  const resume = resumeId
    ? await prisma.resume.findFirst({ where: { id: resumeId, userId } })
    : await prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

  if (!resume) {
    return {
      hasResume: false,
      resume: null,
      summary: {
        totalActiveJobsEvaluated: 0,
        bestFitCount: 0,
        oneSkillBreakoutCount: 0,
        evidenceShiftedCount: 0,
        needsValidationCount: 0,
        deprioritizedCount: 0,
      },
      buckets: {
        topBestFit: [],
        oneSkillBreakouts: [],
        evidenceShifted: [],
        needsValidation: [],
        deprioritized: [],
      },
    };
  }

  const [userSkills, jobs, applications, savedJobs] = await Promise.all([
    listUserSkills(userId),
    prisma.job.findMany({
      where: { isActive: true },
      orderBy: { lastSyncedAt: "desc" },
      take: 250,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        source: true,
        url: true,
        salaryRange: true,
        lastSyncedAt: true,
        requirements: true,
        description: true,
      },
    }),
    prisma.application.findMany({
      where: { userId },
      select: { jobId: true, status: true },
    }),
    prisma.savedJob.findMany({
      where: { userId },
      select: { jobId: true },
    }),
  ]);

  const applicationsByJobId = new Map(
    applications.map((a) => [a.jobId, a.status] as const),
  );
  const savedJobIds = new Set(savedJobs.map((s) => s.jobId));

  const radar = buildRoleFitRadar({
    resumeSkills: resume.skills,
    userSkills: userSkills.map((s) => ({
      skill: s.skill,
      status: s.status,
      evidence: s.evidence,
    })),
    jobs,
    applicationsByJobId,
    savedJobIds,
  });

  recordFeatureEvent({
    userId,
    event: "radar_viewed",
    metadata: {
      resumeId: resume.id,
      evaluatedJobsCount: jobs.length,
      bestFitCount: radar.summary.bestFitCount,
    },
  });

  return {
    hasResume: true,
    resume: {
      id: resume.id,
      title: resume.title,
      fileName: resume.fileName,
      skillsCount: resume.skills.length,
      experienceYrs: resume.experienceYrs,
    },
    ...radar,
  };
};
