//server/src/controllers/match.controller.ts
import { Request, Response } from "express";
import { matchResumeToJob } from "../services/matching/matchService";

export const matchResumeToJobController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { resumeId, jobId } = req.body;
    if (!resumeId || !jobId) {
      return res.status(400).json({
        success: false,
        message: "resumeId and jobId are required",
      });
    }
    const result = await matchResumeToJob(req.user!.userId, resumeId, jobId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Resume not found") {
        return res.status(404).json({
          success: false,
          message: "Resume not found",
        });
      }

      if (error.message === "Job not found") {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }
    }

    console.error("Match controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate job match",
    });
  }
};
