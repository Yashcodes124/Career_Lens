//server/src/controllers/applicationController.ts

import type { Request, Response } from "express";
import { ApplicationStatus } from "@prisma/client";
import {
  createApplicationService,
  getApplicationByIdService,
  getApplicationsService,
  updateApplicationStatusService,
} from "../services/applicationService";

export const createApplicationController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.userId;
    const { jobId } = req.params;

    const application = await createApplicationService(userId, jobId);

    res.status(201).json({
      success: true,
      application,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Job not found") {
      res.status(404).json({
        success: false,
        message: "Job not found",
      });
      return;
    }

    console.error("Create application error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create application",
    });
  }
};

export const getApplicationsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.userId;

    const applications = await getApplicationsService(userId);

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Get applications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

export const getApplicationByIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const application = await getApplicationByIdService(userId, id);

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found") {
      res.status(404).json({
        success: false,
        message: "Application not found",
      });
      return;
    }

    console.error("Get application error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
    });
  }
};

export const updateApplicationStatusController = async (
  req: Request,
  res: Response,
) => {
  try {
    
    const userId = req.user!.userId;
    const { id } = req.params;
    const { status } = req.body;
console.log("BODY:", req.body);
    console.log("STATUS:", req.body?.status);
    console.log("ENUM:", ApplicationStatus);
    console.log("VALID STATUSES:", Object.values(ApplicationStatus));

    if (!Object.values(ApplicationStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid application status",
      });
      return;
    }

    const application = await updateApplicationStatusService(
      userId,
      id,
      status,
    );

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found") {
      res.status(404).json({
        success: false,
        message: "Application not found",
      });
      return;
    }

    console.error("Update application status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update application status",
    });
  }
};
