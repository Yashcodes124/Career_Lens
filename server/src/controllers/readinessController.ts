import { NextFunction, Request, Response } from "express";
import { getReadinessService } from "../services/readiness/readinessService";

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
