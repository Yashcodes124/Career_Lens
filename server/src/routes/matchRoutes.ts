//server/src/routes/match.routes.ts

import { Router } from "express";
import {
  matchResumeToJobController,
  simulateMatchImpactController,
} from "../controllers/matchController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
router.post("/", authMiddleware, matchResumeToJobController);
router.post("/simulate", authMiddleware, simulateMatchImpactController);

export default router;
