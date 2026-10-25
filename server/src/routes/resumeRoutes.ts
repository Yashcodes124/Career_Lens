import { Router } from "express";
import { uploadLimiter } from "../middleware/rateLimit";
import {
  createResume,
  deleteResumeController,
  getUserResumeByIdController,
  getUserResumeController,
} from "../controllers/resumeController";
import { tailorResumeController } from "../controllers/resumeController";
import { authMiddleware } from "../middleware/authMiddleware";
import { uploadResumeFile } from "../middleware/uploadMiddleware";

const router = Router();

router.post("/", authMiddleware, uploadLimiter, uploadResumeFile, createResume);
router.post("/:id/tailoring", authMiddleware, tailorResumeController);
router.get("/", authMiddleware, getUserResumeController);
router.get("/:id", authMiddleware, getUserResumeByIdController);
router.delete("/:id", authMiddleware, deleteResumeController);

export default router;
