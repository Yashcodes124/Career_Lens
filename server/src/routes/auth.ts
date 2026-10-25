import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

//==================  authentication/user-account routes

router.post("/register", authLimiter, register); //new user register and login verification
router.post("/login", authLimiter, login);

router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile); //user profile and updates

export default router;
