import { NextFunction, Request, Response } from "express";
import {
  getReadinessService,
  submitSkillProofService,
} from "../services/readiness/readinessService";

export const getReadinessController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await getReadinessService(req.user!.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const submitSkillProofController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await submitSkillProofService(
      req.user!.userId,
      req.body ?? {},
    );
    res.status(200).json({
      success: true,
      message: "Skill proof recorded and readiness/match recalculated.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
