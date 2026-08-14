import { Router } from "express";
import { createResume } from "../controllers/resumeController";
import { authMiddleware } from "../middleware/authMiddleware";
import { uploadResume } from "../middleware/uploadMiddleware";

const router = Router();

router.post("/", authMiddleware, uploadResume.single("resume"), createResume);

export default router;
