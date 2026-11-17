import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { prisma } from "../config/db";
import {
  ALL_SKILL_FAMILIES,
  ALIAS_TO_CANONICAL,
  SKILL_DICTIONARY,
  SKILL_FAMILY_LABELS,
  listUnrecognizedSkillQueue,
  resolveUnrecognizedSkillToken,
  runExtractionAccuracyBenchmark,
  runFalsePositiveAudit,
  type SkillFamily,
} from "../services/matching/skillDictionary";
import { normalizeSkills } from "../services/matching/skillNormalizer";
import { extractJobSkills } from "../services/matching/jobSkillExtractor";

const router = Router();

router.get(
  "/dashboard",
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Scan active jobs and recent resumes to populate live unrecognized skill tokens & INSUFFICIENT_DATA jobs
      const [jobs, resumes] = await Promise.all([
        prisma.job.findMany({
          where: { isActive: true },
          take: 150,
          orderBy: { lastSyncedAt: "desc" },
          select: {
            id: true,
            title: true,
            company: true,
            source: true,
            requirements: true,
            description: true,
          },
        }),
        prisma.resume.findMany({
          take: 50,
          orderBy: { createdAt: "desc" },
          select: { id: true, skills: true },
        }),
      ]);

      const insufficientDataJobs: Array<{
        id: string;
        title: string;
        company: string;
        source: string;
        storedRequirementsCount: number;
        reextractedSkillsCount: number;
        reason: string;
      }> = [];

      let totalJobsWithSkills = 0;

      for (const job of jobs) {
        normalizeSkills(
          job.requirements ?? [],
          "JOB_REQUIREMENT",
          `${job.title} at ${job.company}`,
        );

        const reextracted = extractJobSkills(job.description ?? "");
        const effectiveCount = Math.max(
          (job.requirements ?? []).length,
          reextracted.length,
        );

        if (effectiveCount > 0) {
          totalJobsWithSkills++;
        }

        if ((job.requirements ?? []).length === 0) {
          insufficientDataJobs.push({
            id: job.id,
            title: job.title,
            company: job.company,
            source: job.source,
            storedRequirementsCount: 0,
            reextractedSkillsCount: reextracted.length,
            reason:
              reextracted.length > 0
                ? `Stored requirements[] is empty, though ${reextracted.length} skills appear in full description text.`
                : "Job posting contains zero recognizable technical skill keywords (triggers INSUFFICIENT_DATA).",
          });
        }
      }

      for (const r of resumes) {
        normalizeSkills(r.skills ?? [], "RESUME_SKILL", `Resume ${r.id}`);
      }

      // 2. Compute family breakdown & alias coverage
      const familyStats = ALL_SKILL_FAMILIES.map((family) => {
        const entries = SKILL_DICTIONARY.filter((e) => e.family === family);
        const aliasCount = entries.reduce(
          (sum, e) => sum + new Set([e.canonical, ...e.aliases]).size,
          0,
        );
        const withPrerequisites = entries.filter(
          (e) => (e.prerequisites?.length ?? 0) > 0,
        ).length;
        return {
          family,
          label: SKILL_FAMILY_LABELS[family],
          canonicalCount: entries.length,
          aliasCount,
          withPrerequisitesCount: withPrerequisites,
        };
      });

      const totalCanonicalSkills = SKILL_DICTIONARY.length;
      const totalAliases = ALIAS_TO_CANONICAL.size;
      const avgAliasesPerSkill = Number(
        (totalAliases / Math.max(1, totalCanonicalSkills)).toFixed(2),
      );
      const liveJobCoveragePct =
        jobs.length > 0
          ? Math.round((totalJobsWithSkills / jobs.length) * 100)
          : 100;

      const falsePositiveAudit = runFalsePositiveAudit();
      const extractionBenchmark = runExtractionAccuracyBenchmark();
      const reviewQueue = await listUnrecognizedSkillQueue();

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalCanonicalSkills,
            totalAliases,
            avgAliasesPerSkill,
            familiesCount: ALL_SKILL_FAMILIES.length,
            liveJobCoveragePct,
            totalJobsAudited: jobs.length,
            insufficientDataCount: insufficientDataJobs.length,
            pendingReviewCount: reviewQueue.filter(
              (q) => q.status === "PENDING",
            ).length,
          },
          familyStats,
          reviewQueue,
          insufficientDataJobs: insufficientDataJobs.slice(0, 20),
          falsePositiveAudit,
          extractionBenchmark,
          skillsCatalog: SKILL_DICTIONARY.map((s) => ({
            canonical: s.canonical,
            aliases: s.aliases,
            family: s.family,
            tier: s.tier ?? "core",
            prerequisites: s.prerequisites ?? [],
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/review-queue/resolve",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, action, targetCanonical, family } = req.body ?? {};

      if (typeof token !== "string" || !token.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "token is required" });
      }

      if (
        action !== "APPROVE_CANONICAL" &&
        action !== "MAP_ALIAS" &&
        action !== "DISMISS"
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid resolution action" });
      }

      if (
        action === "MAP_ALIAS" &&
        (typeof targetCanonical !== "string" || !targetCanonical.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "targetCanonical is required when action is MAP_ALIAS",
        });
      }

      const validFamily =
        typeof family === "string" &&
        ALL_SKILL_FAMILIES.includes(family as SkillFamily)
          ? (family as SkillFamily)
          : undefined;

      const updated = await resolveUnrecognizedSkillToken({
        token: token.trim(),
        action,
        targetCanonical:
          typeof targetCanonical === "string"
            ? targetCanonical.trim()
            : undefined,
        family: validFamily,
      });

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
