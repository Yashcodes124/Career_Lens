//server/src/routes/applicationRoutes.ts

import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createApplicationController,
  getApplicationByIdController,
  getApplicationsController,
  updateApplicationStatusController,
} from "../controllers/applicationController";

const router = Router();

router.use(authMiddleware);

router.get("/", getApplicationsController);
router.get("/:id", getApplicationByIdController);
router.post("/job/:jobId", createApplicationController);
router.patch("/:id/status", updateApplicationStatusController);

export default router;
