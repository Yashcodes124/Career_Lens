import { Request, Response } from "express";
import { createResumeService } from "../services/resume/resumeService";



export const createResume = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const resume = await createResumeService(
    userId,
    req.file?.originalname ?? "Untitled Resume",
  );

  return res.status(201).json({
    success: true,
    data: resume,
  });
};