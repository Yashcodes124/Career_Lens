import { Router } from "express";
import {
  getJobByIdController,
  getJobsController,
  syncGreenhouseController,
  importExternalJobController,
  getSavedJobsController,
  unsaveJobController,
  saveJobController,
} from "../controllers/jobController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.get("/", authMiddleware, getJobsController);
router.get("/saved", authMiddleware, getSavedJobsController);

router.post("/sync", authMiddleware, syncGreenhouseController);
router.post(
  "/sync/greenhouse",
  authMiddleware,
  requireRole("ADMIN"),
  syncGreenhouseController,
);
router.post("/external", authMiddleware, importExternalJobController);

router.get("/:id", authMiddleware, getJobByIdController);
router.post("/:id/save", authMiddleware, saveJobController);
router.delete("/:id/save", authMiddleware, unsaveJobController);

export default router;
