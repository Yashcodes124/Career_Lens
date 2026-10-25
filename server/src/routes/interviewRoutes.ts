// server / src / modules / interview / interviewRoutes.ts;

import { Router } from "express";
import { aiLimiter } from "../middleware/rateLimit";
import {
  createInterviewController,
  getInterviewSessionByIdController,
  startInterviewController,
  submitAnswerController,
  generateFinalEvaluationController,
} from "../controllers/interviewController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware, aiLimiter, createInterviewController);
router.get("/:interviewId", authMiddleware, getInterviewSessionByIdController);
router.post("/:interviewId/start", authMiddleware, startInterviewController);
router.post(
  "/:interviewId/questions/:questionId/answer",
  authMiddleware,
  aiLimiter,
  submitAnswerController,
);
router.post(
  "/:interviewId/evaluation",
  authMiddleware,
  aiLimiter,
  generateFinalEvaluationController,
);

export default router;
