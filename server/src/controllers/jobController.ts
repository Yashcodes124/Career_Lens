//server/src/controllers/jobController.ts

import type { Request, Response } from "express";
import { getJobByIdService, getJobsService } from "../services/jobService";
import { syncGreenhouseJobs } from "../services/greenhouseSyncService";
import {
  getSavedJobsService,
  unsaveJobService,
  saveJobService,
} from "../services/savedJobService";

// get the jobs '/'
export const getJobsController = async (req: Request, res: Response) => {
  try {
    const jobs = await getJobsService();

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Get jobs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

//get jobs by '/:id'
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

//sync greenhouse  '/sync/generate'
export const syncGreenhouseController = async (req: Request, res: Response) => {
  try {
    const boardToken = process.env.GREENHOUSE_BOARD_TOKEN;

    const company = process.env.GREENHOUSE_COMPANY;

    if (!boardToken || !company) {
      res.status(500).json({
        success: false,
        message: "Greenhouse configuration is missing",
      });

      return;
    }

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

//======================== Saved Jobs ======================

export const saveJobController = async (req: Request, res: Response) => {
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
    if (error instanceof Error && error.message === "Job not found") {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });

      return;
    }

    console.error("Save job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save job",
    });
  }
};

export const unsaveJobController = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await unsaveJobService(userId, id);

    res.status(200).json({
      success: true,
      message: "Job removed from saved jobs",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Saved job not found") {
      res.status(404).json({
        success: false,
        message: "Saved job not found",
      });

      return;
    }

    console.error("Unsave job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove saved job",
    });
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
