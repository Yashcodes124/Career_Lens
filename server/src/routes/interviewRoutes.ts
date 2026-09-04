// server / src / modules / interview / interviewRoutes.ts;

import { Router } from "express";
import {
  createInterviewController,
  getInterviewSessionByIdController,
  startInterviewController,
  submitAnswerController,
} from "../controllers/interviewController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware, createInterviewController);
router.get("/:interviewId", authMiddleware, getInterviewSessionByIdController);
router.post("/:interviewId/start", authMiddleware, startInterviewController);
router.post(
  "/:interviewId/questions/:questionId/answer",
  authMiddleware,
  submitAnswerController,
);
export default router;
