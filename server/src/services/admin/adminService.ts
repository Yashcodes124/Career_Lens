import { prisma } from "../../config/db";
import { env } from "../../config/env";
import { getAiReliabilitySnapshot } from "../../integrations/ai/aiTelemetry";
import {
  getLatestSyncHealth,
  syncAllSoftwareJobs,
} from "../greenhouseSyncService";
import {
  ALL_SKILL_FAMILIES,
  ALIAS_TO_CANONICAL,
  SKILL_DICTIONARY,
  listUnrecognizedSkillQueue,
  resolveUnrecognizedSkillToken,
  runExtractionAccuracyBenchmark,
  runFalsePositiveAudit,
  type SkillFamily,
} from "../matching/skillDictionary";

export interface AdminQueryFilters {
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

export const parseAdminFilters = (
  query: Record<string, unknown>,
): AdminQueryFilters => {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(5, Number(query.pageSize) || 20));

  let from: Date | undefined;
  let to: Date | undefined;

  if (typeof query.from === "string" && query.from.trim()) {
    const parsed = new Date(query.from);
    if (!Number.isNaN(parsed.getTime())) from = parsed;
  }
  if (typeof query.to === "string" && query.to.trim()) {
    const parsed = new Date(query.to);
    if (!Number.isNaN(parsed.getTime())) to = parsed;
  }

  return { from, to, page, pageSize };
};

const buildDateWhere = (filters: AdminQueryFilters) => {
  if (!filters.from && !filters.to) return undefined;
  return {
    ...(filters.from ? { gte: filters.from } : {}),
    ...(filters.to ? { lte: filters.to } : {}),
  };
};

const computePercentile = (sortedAsc: number[], pct: number): number => {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.ceil((pct / 100) * sortedAsc.length) - 1),
  );
  return Math.round(sortedAsc[idx]);
};

// 1. System Health Overview
export const getAdminOverviewService = async () => {
  let databaseHealthy = false;
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    databaseHealthy = true;
  } catch {
    databaseHealthy = false;
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [aiTotal24h, aiFailed24h, activeJobsCount, totalUsersCount] =
    await Promise.all([
      prisma.aiRequestAudit
        .count({ where: { createdAt: { gte: since24h } } })
        .catch(() => 0),
      prisma.aiRequestAudit
        .count({ where: { status: "FAILED", createdAt: { gte: since24h } } })
        .catch(() => 0),
      prisma.job.count({ where: { isActive: true } }).catch(() => 0),
      prisma.user.count().catch(() => 0),
    ]);

  const memSnapshot = getAiReliabilitySnapshot();
  const effectiveTotal = Math.max(aiTotal24h, memSnapshot.totalLoggedRequests);
  const errorRatePct =
    effectiveTotal > 0
      ? Number(((aiFailed24h / effectiveTotal) * 100).toFixed(2))
      : 0;

  return {
    apiUptimeSeconds: Math.round(process.uptime()),
    environment: env.NODE_ENV,
    deploymentVersion:
      process.env.RENDER_GIT_COMMIT?.slice(0, 7) ||
      process.env.npm_package_version ||
      "1.0.0",
    database: {
      status: databaseHealthy ? "CONNECTED" : "DEGRADED",
      latencyMs: dbLatencyMs,
    },
    aiProvider: {
      configured: Boolean(env.resolvedAiApiKey),
      primaryProvider: process.env.AI_PROVIDER || "groq",
      requestsLast24h: effectiveTotal,
      failedLast24h: aiFailed24h,
      errorRatePct,
    },
    sentry: {
      configured: Boolean(process.env.SENTRY_DSN),
      errorRatePct,
    },
    platformTotals: {
      registeredUsers: totalUsersCount,
      activeJobs: activeJobsCount,
      canonicalSkills: SKILL_DICTIONARY.length,
    },
  };
};

// 2. Job Sync Health & Audit Log
export const getAdminJobSyncsService = async (filters: AdminQueryFilters) => {
  const createdAt = buildDateWhere(filters);
  const where = createdAt ? { createdAt } : {};
  const staleCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [totalLogs, logs, staleJobsCount, activeBySource] = await Promise.all([
    prisma.jobSyncAudit.count({ where }),
    prisma.jobSyncAudit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      select: {
        id: true,
        source: true,
        boardToken: true,
        status: true,
        jobsFetched: true,
        jobsCreated: true,
        jobsUpdated: true,
        jobsDeactivated: true,
        duplicatesFound: true,
        durationMs: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
    prisma.job.count({
      where: { isActive: true, lastSyncedAt: { lt: staleCutoff } },
    }),
    prisma.job.groupBy({
      by: ["source"],
      where: { isActive: true },
      _count: { _all: true },
      _max: { lastSyncedAt: true },
    }),
  ]);

  const totalFetched = logs.reduce((s, r) => s + r.jobsFetched, 0);
  const totalDuplicates = logs.reduce((s, r) => s + r.duplicatesFound, 0);
  const failedSyncs = logs.filter((r) => r.status === "FAILED").length;
  const duplicateRatePct =
    totalFetched > 0
      ? Number(((totalDuplicates / totalFetched) * 100).toFixed(2))
      : 0;

  return {
    latestMemoryHealth: getLatestSyncHealth(),
    summary: {
      totalSyncRuns: totalLogs,
      failedSyncs,
      duplicateRatePct,
      staleJobsCount,
    },
    bySource: activeBySource.map((row) => ({
      source: row.source,
      activeJobsCount: row._count._all,
      lastSyncedAt: row._max.lastSyncedAt,
    })),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: totalLogs,
      totalPages: Math.max(1, Math.ceil(totalLogs / filters.pageSize)),
    },
    logs,
  };
};

// 3. AI Reliability (P50/P95 Latency, Tokens, Cost, Sanitized Failures)
export const getAdminAiReliabilityService = async (
  filters: AdminQueryFilters,
) => {
  const createdAt = buildDateWhere(filters);
  const where = createdAt ? { createdAt } : {};

  const [totalRequests, allMetricsRows, recentFailures] = await Promise.all([
    prisma.aiRequestAudit.count({ where }),
    prisma.aiRequestAudit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        feature: true,
        provider: true,
        model: true,
        status: true,
        latencyMs: true,
        inputTokens: true,
        outputTokens: true,
        costUsd: true,
        errorCode: true,
      },
    }),
    prisma.aiRequestAudit.findMany({
      where: { ...where, status: "FAILED" },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      select: {
        id: true,
        feature: true,
        provider: true,
        model: true,
        status: true,
        latencyMs: true,
        errorCode: true,
        createdAt: true,
      },
    }),
  ]);

  const latencies = allMetricsRows
    .map((r) => r.latencyMs)
    .sort((a, b) => a - b);
  const p50LatencyMs = computePercentile(latencies, 50);
  const p95LatencyMs = computePercentile(latencies, 95);

  let successCount = 0;
  let failureCount = 0;
  let fallbackCount = 0;
  let timeoutCount = 0;
  let rateLimitCount = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;

  const byFeatureMap = new Map<
    string,
    {
      feature: string;
      requests: number;
      successes: number;
      failures: number;
      fallbacks: number;
      totalCostUsd: number;
    }
  >();

  for (const row of allMetricsRows) {
    if (row.status === "SUCCESS") successCount++;
    else if (row.status === "FALLBACK") {
      successCount++;
      fallbackCount++;
    } else if (row.status === "FAILED") {
      failureCount++;
    }

    if (row.errorCode === "AI_TIMEOUT") timeoutCount++;
    if (row.errorCode === "AI_RATE_LIMITED") rateLimitCount++;

    totalInputTokens += row.inputTokens ?? 0;
    totalOutputTokens += row.outputTokens ?? 0;
    totalCostUsd += row.costUsd ?? 0;

    const fb = byFeatureMap.get(row.feature) ?? {
      feature: row.feature,
      requests: 0,
      successes: 0,
      failures: 0,
      fallbacks: 0,
      totalCostUsd: 0,
    };
    fb.requests++;
    if (row.status === "FAILED") fb.failures++;
    else fb.successes++;
    if (row.status === "FALLBACK") fb.fallbacks++;
    fb.totalCostUsd = Number((fb.totalCostUsd + (row.costUsd ?? 0)).toFixed(6));
    byFeatureMap.set(row.feature, fb);
  }

  return {
    summary: {
      totalRequests,
      successCount,
      failureCount,
      fallbackCount,
      timeoutCount,
      rateLimitCount,
      p50LatencyMs,
      p95LatencyMs,
      totalInputTokens,
      totalOutputTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(6)),
    },
    byFeature: [...byFeatureMap.values()],
    recentFailures,
  };
};

// 4. Resume Parsing Quality
export const getAdminResumeQualityService = async (
  filters: AdminQueryFilters,
) => {
  const createdAt = buildDateWhere(filters);
  const where = createdAt ? { createdAt } : {};

  const [audits, resumes, reanalysisCount] = await Promise.all([
    prisma.resumeParseAudit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        status: true,
        qualityScore: true,
        textLength: true,
        warnings: true,
        durationMs: true,
      },
    }),
    prisma.resume.findMany({
      where: createdAt ? { createdAt } : {},
      take: 500,
      select: { skills: true },
    }),
    prisma.featureUsageEvent.count({
      where: {
        event: "resume_reanalyzed",
        ...(createdAt ? { createdAt } : {}),
      },
    }),
  ]);

  const totalParses = audits.length;
  const successParses = audits.filter((a) => a.status === "SUCCESS").length;
  const failedParses = audits.filter((a) => a.status === "FAILED").length;
  const lowQualityParses = audits.filter(
    (a) => a.status === "LOW_QUALITY",
  ).length;

  let scannedPdfCount = 0;
  const warningCounts = new Map<string, number>();

  for (const audit of audits) {
    const list = Array.isArray(audit.warnings) ? audit.warnings : [];
    for (const w of list) {
      const code =
        typeof w === "string"
          ? w
          : typeof w === "object" && w !== null && "code" in w
            ? String((w as { code: unknown }).code)
            : "UNKNOWN_WARNING";
      warningCounts.set(code, (warningCounts.get(code) ?? 0) + 1);
      if (code === "SCANNED_OR_LOW_TEXT" || code === "NO_READABLE_TEXT") {
        scannedPdfCount++;
      }
    }
  }

  const totalExtractedSkills = resumes.reduce(
    (sum, r) => sum + (r.skills?.length ?? 0),
    0,
  );
  const avgExtractedSkills =
    resumes.length > 0
      ? Number((totalExtractedSkills / resumes.length).toFixed(1))
      : 0;

  return {
    summary: {
      totalParses,
      parseSuccessRatePct:
        totalParses > 0
          ? Number(((successParses / totalParses) * 100).toFixed(1))
          : 100,
      parseFailureRatePct:
        totalParses > 0
          ? Number(((failedParses / totalParses) * 100).toFixed(1))
          : 0,
      lowQualityRatePct:
        totalParses > 0
          ? Number(((lowQualityParses / totalParses) * 100).toFixed(1))
          : 0,
      scannedPdfRatePct:
        totalParses > 0
          ? Number(((scannedPdfCount / totalParses) * 100).toFixed(1))
          : 0,
      reanalysisUsageCount: reanalysisCount,
      avgExtractedSkillsCount: avgExtractedSkills,
    },
    commonWarnings: [...warningCounts.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count),
  };
};

// 5. Matching & Ontology Quality
export const getAdminMatchingQualityService = async (
  filters: AdminQueryFilters,
) => {
  const createdAt = buildDateWhere(filters);

  const [applications, totalActiveJobs, insufficientJobs, reviewQueue] =
    await Promise.all([
      prisma.application.findMany({
        where: createdAt ? { createdAt } : {},
        take: 1000,
        select: { matchScore: true, skillGaps: true },
      }),
      prisma.job.count({ where: { isActive: true } }),
      prisma.job.count({
        where: { isActive: true, requirements: { equals: [] } },
      }),
      listUnrecognizedSkillQueue(),
    ]);

  const missingSkillFrequency = new Map<string, number>();
  for (const app of applications) {
    for (const gap of app.skillGaps ?? []) {
      const key = gap.toLowerCase().trim();
      if (key) {
        missingSkillFrequency.set(
          key,
          (missingSkillFrequency.get(key) ?? 0) + 1,
        );
      }
    }
  }

  const insufficientDataRatePct =
    totalActiveJobs > 0
      ? Number(((insufficientJobs / totalActiveJobs) * 100).toFixed(1))
      : 0;

  const falsePositiveAudit = runFalsePositiveAudit();
  const extractionBenchmark = runExtractionAccuracyBenchmark();

  return {
    summary: {
      canonicalSkillsCount: SKILL_DICTIONARY.length,
      totalAliasesCount: ALIAS_TO_CANONICAL.size,
      familiesCount: ALL_SKILL_FAMILIES.length,
      insufficientDataRatePct,
      insufficientDataJobsCount: insufficientJobs,
      pendingReviewQueueSize: reviewQueue.filter((q) => q.status === "PENDING")
        .length,
      falsePositivePassRatePct: falsePositiveAudit.passRatePct,
      extractionF1Pct: extractionBenchmark.f1Pct,
    },
    topMissingSkills: [...missingSkillFrequency.entries()]
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    reviewQueue: reviewQueue.slice(0, 50),
    falsePositiveAudit,
    extractionBenchmark,
  };
};

// 6. Closed-Loop Effectiveness (Aggregate Only — Zero User PII)
export const getAdminClosedLoopService = async (filters: AdminQueryFilters) => {
  const createdAt = buildDateWhere(filters);
  const where = createdAt ? { createdAt } : {};

  const [
    interviews,
    evaluationsCount,
    userSkills,
    proofSubmissionsCount,
    applicationsWithScores,
  ] = await Promise.all([
    prisma.interview.findMany({
      where,
      select: { userId: true, status: true },
    }),
    prisma.evaluation.count({ where }),
    prisma.userSkill.findMany({
      select: { status: true },
    }),
    prisma.featureUsageEvent.count({
      where: { event: "skill_proof_submitted", ...where },
    }),
    prisma.application.findMany({
      where: { matchScore: { not: null } },
      select: { matchScore: true },
    }),
  ]);

  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter(
    (i) => i.status === "COMPLETED",
  ).length;

  const completionRatePct =
    totalInterviews > 0
      ? Number(((completedInterviews / totalInterviews) * 100).toFixed(1))
      : 0;

  const evaluationSuccessRatePct =
    completedInterviews > 0
      ? Number(
          Math.min(100, (evaluationsCount / completedInterviews) * 100).toFixed(
            1,
          ),
        )
      : 0;

  const strongSkillsCount = userSkills.filter(
    (s) => s.status === "STRONG",
  ).length;
  const weakSkillsCount = userSkills.filter((s) => s.status === "WEAK").length;
  const skillsPerCompletedInterview =
    completedInterviews > 0
      ? Number(
          ((strongSkillsCount + weakSkillsCount) / completedInterviews).toFixed(
            2,
          ),
        )
      : 0;

  // Repeat interview rate & returning users retention proxy
  const completedByUser = new Map<string, number>();
  for (const iv of interviews) {
    if (iv.status === "COMPLETED") {
      completedByUser.set(iv.userId, (completedByUser.get(iv.userId) ?? 0) + 1);
    }
  }
  const usersWithCompleted = completedByUser.size;
  const repeatUsers = [...completedByUser.values()].filter(
    (count) => count >= 2,
  ).length;
  const repeatInterviewRatePct =
    usersWithCompleted > 0
      ? Number(((repeatUsers / usersWithCompleted) * 100).toFixed(1))
      : 0;

  const avgMatchScore =
    applicationsWithScores.length > 0
      ? Math.round(
          applicationsWithScores.reduce(
            (sum, a) => sum + (a.matchScore ?? 0),
            0,
          ) / applicationsWithScores.length,
        )
      : 0;

  return {
    summary: {
      totalInterviews,
      completedInterviews,
      interviewCompletionRatePct: completionRatePct,
      evaluationGenerationRatePct: evaluationSuccessRatePct,
      verifiedStrongSkillsTotal: strongSkillsCount,
      invalidatedWeakSkillsTotal: weakSkillsCount,
      skillsUpdatedPerInterview: skillsPerCompletedInterview,
      proofSubmissionsCount,
      averageVerifiedMatchScorePct: avgMatchScore,
      repeatInterviewRatePct,
      returningUsersWithCompletedInterviews: repeatUsers,
    },
  };
};

export const triggerAdminJobSyncService = async () => {
  return await syncAllSoftwareJobs();
};

export const resolveAdminOntologyTokenService = async (params: {
  token: string;
  action: "APPROVE_CANONICAL" | "MAP_ALIAS" | "DISMISS";
  targetCanonical?: string;
  family?: SkillFamily;
  adminUserId: string;
}) => {
  return await resolveUnrecognizedSkillToken({
    token: params.token,
    action: params.action,
    targetCanonical: params.targetCanonical,
    family: params.family,
    createdBy: params.adminUserId,
  });
};
