import type { NextFunction, Request, Response } from "express";
import { parseJobQuery } from "../utils/jobQuery";
import {
  getJobByIdService,
  getJobsService,
  importExternalJobService,
} from "../services/jobService";
import {
  syncAllSoftwareJobs,
  syncGreenhouseJobs,
  getLatestSyncHealth,
} from "../services/greenhouseSyncService";
import {
  getSavedJobsService,
  unsaveJobService,
  saveJobService,
} from "../services/savedJobService";

export const getJobsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = parseJobQuery(req.query as Record<string, unknown>);
    const { jobs, total } = await getJobsService(filters);
    const latestSyncFromJobs =
      jobs.length > 0
        ? jobs
            .map(
              (j) => j.lastSyncedAt?.toISOString?.() ?? String(j.lastSyncedAt),
            )
            .sort()
            .reverse()[0]
        : null;
    const health = getLatestSyncHealth();

    res.status(200).json({
      success: true,
      jobs,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      syncHealth: {
        ...health,
        lastSuccessfulSyncAt: health.lastSuccessfulSyncAt ?? latestSyncFromJobs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getJobByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const job = await getJobByIdService(req.params.id);

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

export const syncGreenhouseController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const explicitBoardToken =
      typeof req.body?.boardToken === "string"
        ? req.body.boardToken.trim()
        : undefined;
    const explicitCompany =
      typeof req.body?.company === "string"
        ? req.body.company.trim()
        : undefined;

    const result = explicitBoardToken
      ? await syncGreenhouseJobs(
          explicitBoardToken,
          explicitCompany || explicitBoardToken,
        )
      : await syncAllSoftwareJobs();

    res.status(200).json({
      success: true,
      message: "Software engineering jobs synced successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const importExternalJobController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const job = await importExternalJobService(req.body ?? {});
    res.status(201).json({
      success: true,
      job,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

export const saveJobController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const savedJob = await saveJobService(userId, id);

    res.status(201).json({
      success: true,
      message: "Job saved successfully",
      savedJob,
    });
  } catch (error) {
    next(error);
  }
};

export const unsaveJobController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await unsaveJobService(userId, id);

    res.status(200).json({
      success: true,
      message: "Job removed from saved jobs",
    });
  } catch (error) {
    next(error);
  }
};

export const getSavedJobsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;

    const jobs = await getSavedJobsService(userId);

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};
