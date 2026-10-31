import type { NextFunction, Request, Response } from "express";
import { parseJobQuery } from "../utils/jobQuery";
import {
  getJobByIdService,
  getJobsService,
  importExternalJobService,
} from "../services/jobService";
import { syncGreenhouseJobs } from "../services/greenhouseSyncService";
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
    res.status(200).json({
      success: true,
      jobs,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobByIdController = async (req: Request, res: Response) => {
  try {
    const job = await getJobByIdService(req.params.id);

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Job not found") {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    console.error("Get job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch job",
    });
  }
};

export const syncGreenhouseController = async (req: Request, res: Response) => {
  try {
    const boardToken =
      (req.body?.boardToken as string | undefined) ||
      process.env.GREENHOUSE_BOARD_TOKEN ||
      "stripe";
    const company =
      (req.body?.company as string | undefined) ||
      process.env.GREENHOUSE_COMPANY ||
      boardToken;

    const result = await syncGreenhouseJobs(boardToken, company);

    res.status(200).json({
      success: true,
      message: "Greenhouse jobs synced successfully",
      ...result,
    });
  } catch (error) {
    console.error("Greenhouse sync error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to sync Greenhouse jobs",
    });
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

export const getSavedJobsController = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const jobs = await getSavedJobsService(userId);

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Get saved jobs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch saved jobs",
    });
  }
};
