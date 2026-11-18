import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/requireRole";
import { adminLimiter } from "../middleware/rateLimit";
import {
  getAdminAiReliabilityController,
  getAdminClosedLoopController,
  getAdminJobSyncsController,
  getAdminMatchingQualityController,
  getAdminOverviewController,
  getAdminResumeQualityController,
  resolveAdminOntologyController,
  runAdminJobSyncController,
} from "../controllers/adminController";

const router = Router();

// Every admin route requires authentication, ADMIN role, and dedicated rate limiting
router.use(authMiddleware, requireRole("ADMIN"), adminLimiter);

router.get("/overview", getAdminOverviewController);
router.get("/job-syncs", getAdminJobSyncsController);
router.get("/ai-reliability", getAdminAiReliabilityController);
router.get("/resume-quality", getAdminResumeQualityController);
router.get("/matching-quality", getAdminMatchingQualityController);
router.get("/closed-loop", getAdminClosedLoopController);

router.post("/job-syncs/run", runAdminJobSyncController);
router.post("/ontology/review-queue/resolve", resolveAdminOntologyController);

export default router;
