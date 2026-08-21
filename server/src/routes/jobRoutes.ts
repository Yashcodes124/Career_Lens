//server/src/routes/jobRoutes.ts

import { Router } from "express";
import {
  getJobByIdController,
  getJobsController,
  syncGreenhouseController,
} from "../controllers/jobController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, getJobsController);
router.get("/:id", authMiddleware, getJobByIdController);
router.post("/sync/greenhouse", authMiddleware, syncGreenhouseController);

export default router;
