// server / src / modules / interview / interviewRoutes.ts;

import { Router } from "express";
import { createInterviewController } from "../controllers/interviewController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware, createInterviewController);

export default router;
