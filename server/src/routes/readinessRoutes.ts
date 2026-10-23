import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getReadinessController } from "../controllers/readinessController";

const router = Router();

router.get("/", authMiddleware, getReadinessController);

export default router;
