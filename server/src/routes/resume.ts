import { Router } from "express";
import {
  createResume,
  getUserResumeByIdController,
  getUserResumeController,
} from "../controllers/resumeController";
import { authMiddleware } from "../middleware/authMiddleware";
import { uploadResume } from "../middleware/uploadMiddleware";

const router = Router();

router.post("/", authMiddleware, uploadResume.single("resume"), createResume);
router.get("/", authMiddleware, getUserResumeController);
router.get("/:id", authMiddleware, getUserResumeByIdController);

export default router;
