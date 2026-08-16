//server/src/controllers/resumeController.ts

import { Request, Response } from "express";
import { createResumeService } from "../services/resume/resumeService";


export const createResume = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const resume = await createResumeService({
      userId,
      title: title || file.originalname,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      resume,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to upload resume" });
  }
};
