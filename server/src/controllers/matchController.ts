import { NextFunction, Request, Response } from "express";
import { matchResumeToJob } from "../services/matching/matchService";
import { AppError } from "../utils/appError";

export const matchResumeToJobController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { resumeId, jobId } = req.body ?? {};
    if (typeof resumeId !== "string" || typeof jobId !== "string" || !resumeId || !jobId) {
      throw new AppError(400, "resumeId and jobId are required", "VALIDATION_ERROR");
    }

    const data = await matchResumeToJob(req.user!.userId, resumeId, jobId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
