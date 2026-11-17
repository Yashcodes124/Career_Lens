import { Router } from "express";
import { uploadLimiter } from "../middleware/rateLimit";
import {
  createResume,
  deleteResumeController,
  getUserResumeByIdController,
  getUserResumeController,
  createPastedResumeController,
  reanalyzeResumeController,
  updateResumeSectionsController,
} from "../controllers/resumeController";
import {
  tailorResumeController,
  applyTailoredResumeController,
} from "../controllers/resumeController";
import { authMiddleware } from "../middleware/authMiddleware";
import { uploadResumeFile } from "../middleware/uploadMiddleware";

const router = Router();

router.post("/", authMiddleware, uploadLimiter, uploadResumeFile, createResume);
router.post("/:id/tailoring", authMiddleware, tailorResumeController);
router.post(
  "/:id/tailoring/apply",
  authMiddleware,
  applyTailoredResumeController,
);
router.get("/", authMiddleware, getUserResumeController);
router.get("/:id", authMiddleware, getUserResumeByIdController);

router.post(
  "/paste",
  authMiddleware,
  uploadLimiter,
  createPastedResumeController,
);
router.post(
  "/:id/reanalyze",
  authMiddleware,
  uploadLimiter,
  reanalyzeResumeController,
);
router.patch("/:id/sections", authMiddleware, updateResumeSectionsController);
router.delete("/:id", authMiddleware, deleteResumeController);

export default router;
