//server/src/routes/applicationRoutes.ts

import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createApplicationController,
  getApplicationByIdController,
  getApplicationsController,
  deleteApplicationController,
  updateApplicationStatusController,
} from "../controllers/applicationController";

const router = Router();

router.use(authMiddleware);

router.get("/", getApplicationsController);
router.get("/:id", getApplicationByIdController);
router.post("/job/:jobId", createApplicationController);
router.patch("/:id/status", updateApplicationStatusController);
router.delete("/:id", deleteApplicationController);

export default router;
