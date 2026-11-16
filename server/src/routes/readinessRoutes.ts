import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  getReadinessController,
  submitSkillProofController,
} from "../controllers/readinessController";

const router = Router();

router.get("/", authMiddleware, getReadinessController);
router.post("/proof", authMiddleware, submitSkillProofController);

export default router;
