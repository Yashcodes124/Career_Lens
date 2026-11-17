import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getRoleFitRadarService } from "../services/matching/roleFitRadarService";

const router = Router();

router.get(
  "/",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resumeId =
        typeof req.query.resumeId === "string" && req.query.resumeId.trim()
          ? req.query.resumeId.trim()
          : undefined;
      const data = await getRoleFitRadarService(req.user!.userId, resumeId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
