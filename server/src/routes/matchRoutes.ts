//server/src/routes/match.routes.ts

import { Router } from "express";
import { matchResumeToJobController } from "../controllers/matchController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
router.post("/", authMiddleware, matchResumeToJobController);

export default router;
