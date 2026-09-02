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
    const userId = req.user!.userId;
      const { applicationId } = req.body;
      
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    if (!applicationId) {
      res.status(400).json({
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
    // if (error instanceof Error && error.message === "application is required") {
    //   res.status(404).json({
    //     success: false,
    //     message: "application is required",
    //   });
    //   return;
    // }

    // console.error("Create Interview error:", error);

    // res.status(500).json({
    //   success: false,
    //   message: "Failed to create Interview",
    // });
    next(error);
  }
};
