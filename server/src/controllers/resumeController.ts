//server/src/controllers/resumeController.ts

import { NextFunction, Request, Response } from "express";
import { createResumeService } from "../services/resume/resumeService";
import {
  getUserResumeByIdService,
  getUserResumeService,
} from "../services/resume/resumeService";
export const createResume = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required",
      });
    }

    const resume = await createResumeService(userId, file);

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      resume,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to upload resume",
    });
  }
};

export const getUserResumeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const resume = await getUserResumeService(req.user!.userId);
    res.status(200).json({
      success: true,
      resume,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserResumeByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const resume = await getUserResumeByIdService(
      req.user!.userId,
      req.params.id,
    );
    res.status(200).json({
      success: true,
      resume,
    });
  } catch (error) {
    next(error);
  }
};
