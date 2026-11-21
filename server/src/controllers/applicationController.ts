//server/src/controllers/applicationController.ts

import type { NextFunction, Request, Response } from "express";
import { ApplicationStatus } from "@prisma/client";
import {
  createApplicationService,
  getApplicationByIdService,
  deleteApplicationService,
  getApplicationsService,
  updateApplicationStatusService,
} from "../services/applicationService";

export const createApplicationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
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

    next(error);
  }
};

export const getApplicationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;

    const applications = await getApplicationsService(userId);

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
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

    next(error);
  }
};

export const updateApplicationStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { status } = req.body ?? {};

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

    next(error);
  }
};

export const deleteApplicationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await deleteApplicationService(userId, id);

    res.status(200).json({
      success: true,
      message: "Application removed from tracker",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found") {
      res.status(404).json({
        success: false,
        message: "Application not found",
      });
      return;
    }

    next(error);
  }
};
