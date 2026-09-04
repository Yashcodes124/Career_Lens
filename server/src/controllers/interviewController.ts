//server/src/modules/interview/interviewController.ts

import { Request, Response, NextFunction } from "express";
import {
  createInterviewService,
  generateInterviewSessionByIdService,
  startInterviewService,
} from "../services/interviewService";

//POST /api/interviews

export const createInterviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { applicationId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "application ID is required",
      });
    }

    const interview = await createInterviewService(userId, applicationId);

    return res.status(201).json({
      success: true,
      message: "Interview plan created successfully",
      data: interview,
    });
  } catch (error: any) {
    const notFoundErrors = [
      "Application or Associated job not found",
      "User resume not found.",
    ];

    if (notFoundErrors.includes(error.message)) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const getInterviewSessionByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user!.userId;
    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: "Interview ID is required",
      });
    }
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const interview = await generateInterviewSessionByIdService(
      interviewId,
      userId,
    );
    return res.status(200).json({
      success: true,
      message: "Interview session retrieved successfully",
      data: interview,
    });
  } catch (error: any) {
    if (error.message === "Interview session not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const startInterviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    const { interviewId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: "Interview ID is required",
      });
    }

    const result = await startInterviewService(interviewId, userId);

    return res.status(200).json({
      success: true,
      message: "Interview session started successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
