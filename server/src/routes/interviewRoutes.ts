// server / src / modules / interview / interviewRoutes.ts;

import { Router } from "express";
import {
  createInterviewController,
  getInterviewSessionByIdController,
  startInterviewController,
} from "../controllers/interviewController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware, createInterviewController);
router.get("/:interviewId", authMiddleware, getInterviewSessionByIdController);
router.post("/:interviewId/start", authMiddleware, startInterviewController);

export default router;
