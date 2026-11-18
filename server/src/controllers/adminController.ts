import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import {
  getAdminAiReliabilityService,
  getAdminClosedLoopService,
  getAdminJobSyncsService,
  getAdminMatchingQualityService,
  getAdminOverviewService,
  getAdminResumeQualityService,
  parseAdminFilters,
  resolveAdminOntologyTokenService,
  triggerAdminJobSyncService,
} from "../services/admin/adminService";
import type { SkillFamily } from "../services/matching/skillDictionary";

export const getAdminOverviewController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getAdminOverviewService();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getAdminJobSyncsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = parseAdminFilters(req.query as Record<string, unknown>);
    const data = await getAdminJobSyncsService(filters);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getAdminAiReliabilityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = parseAdminFilters(req.query as Record<string, unknown>);
    const data = await getAdminAiReliabilityService(filters);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getAdminResumeQualityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = parseAdminFilters(req.query as Record<string, unknown>);
    const data = await getAdminResumeQualityService(filters);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getAdminMatchingQualityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = parseAdminFilters(req.query as Record<string, unknown>);
    const data = await getAdminMatchingQualityService(filters);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getAdminClosedLoopController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = parseAdminFilters(req.query as Record<string, unknown>);
    const data = await getAdminClosedLoopService(filters);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const runAdminJobSyncController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await triggerAdminJobSyncService();
    res.status(200).json({
      success: true,
      message: "ATS job sync completed.",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const resolveAdminOntologyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, action, targetCanonical, family } = req.body ?? {};
    if (typeof token !== "string" || !token.trim()) {
      throw new AppError(400, "token is required", "VALIDATION_ERROR");
    }
    if (
      action !== "APPROVE_CANONICAL" &&
      action !== "MAP_ALIAS" &&
      action !== "DISMISS"
    ) {
      throw new AppError(400, "Invalid resolution action", "VALIDATION_ERROR");
    }

    const data = await resolveAdminOntologyTokenService({
      token,
      action,
      targetCanonical:
        typeof targetCanonical === "string" ? targetCanonical : undefined,
      family: typeof family === "string" ? (family as SkillFamily) : undefined,
      adminUserId: req.user!.userId,
    });

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
