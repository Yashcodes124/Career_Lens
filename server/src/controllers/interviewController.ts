//server/src/modules/interview/interviewController.ts

import { Request, Response, NextFunction } from "express";
import { createInterviewService } from "../services/interviewService";

//POST /api/interviews

export const createInterviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId =req.user!.userId;
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
  } catch (error) {
    next(error);
  }
};
