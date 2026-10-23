//server/src/controllers/resumeController.ts
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import {
  createResumeService,
  deleteResumeService,
  getUserResumeByIdService,
  getUserResumeService,
} from "../services/resume/resumeService";

export const createResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError(400, "Choose a PDF or DOCX resume to upload", "FILE_REQUIRED");
    }

    const resume = await createResumeService(req.user!.userId, file);
    res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      resume,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserResumeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resumes = await getUserResumeService(req.user!.userId);
    res.status(200).json({ success: true, resumes });
  } catch (error) {
    next(error);
  }
};

export const getUserResumeByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resume = await getUserResumeByIdService(req.user!.userId, req.params.id);
    res.status(200).json({ success: true, resume });
  } catch (error) {
    next(error);
  }
};

export const deleteResumeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteResumeService(req.user!.userId, req.params.id);
    res.status(200).json({ success: true, message: "Resume deleted" });
  } catch (error) {
    next(error);
  }
};
