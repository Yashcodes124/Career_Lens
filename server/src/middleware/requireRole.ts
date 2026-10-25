import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "./authMiddleware";

// Must run after authMiddleware. Rejects any signed-in user without the required role.
export const requireRole = (role: "ADMIN" | "USER") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || user.role !== role) {
      res.status(403).json({
        success: false,
        message: "You do not have permission for this action",
        code: "FORBIDDEN",
      });
      return;
    }
    next();
  };
