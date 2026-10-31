import { Request, Response, NextFunction } from "express";
import {
  createInterviewService,
  generateInterviewSessionByIdService,
  startInterviewService,
  submitAnswerService,
  generateFinalEvaluationService,
} from "../services/interviewService";

export const createInterviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { applicationId, durationMinutes, difficulty, focusTopics } =
      req.body ?? {};

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

    const hasCustomOptions =
      durationMinutes !== undefined ||
      difficulty !== undefined ||
      (Array.isArray(focusTopics) && focusTopics.length > 0);

    const interview = hasCustomOptions
      ? await createInterviewService(userId, applicationId, {
          durationMinutes:
            typeof durationMinutes === "number" ? durationMinutes : undefined,
          difficulty:
            difficulty === "EASY" ||
            difficulty === "MEDIUM" ||
            difficulty === "HARD"
              ? difficulty
              : undefined,
          focusTopics: Array.isArray(focusTopics)
            ? focusTopics.map(String)
            : undefined,
        })
      : await createInterviewService(userId, applicationId);

    return res.status(201).json({
      success: true,
      message: "Interview plan created successfully",
      data: interview,
    });
  } catch (error) {
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
  } catch (error) {
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

export const submitAnswerController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    const { interviewId, questionId } = req.params;
    const { answer } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }

    if (!answer || answer.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Answer string is required" });
    }

    const result = await submitAnswerService(
      interviewId,
      questionId,
      userId,
      answer,
    );

    return res.status(200).json({
      success: true,
      message: "Answer submitted and evaluated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const generateFinalEvaluationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;
    const { interviewId } = req.params;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }
    const evaluation = await generateFinalEvaluationService(
      interviewId,
      userId,
    );

    return res.status(201).json({
      success: true,
      message: "Interview evaluation generated successfully",
      data: {
        evaluation,
      },
    });
  } catch (error) {
    next(error);
  }
};
