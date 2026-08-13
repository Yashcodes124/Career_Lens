import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/authValidator.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = registerSchema.parse(req.body);
    const result = await authService.register(validatedInput);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    if (error.message === 'User with this email already exists') {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validatedInput = loginSchema.parse(req.body);
    const result = await authService.login(validatedInput);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    if (error.message === 'Invalid email or password') {
      res.status(401).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const profile = await authService.getProfile(userId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const validatedInput = updateProfileSchema.parse(req.body);
    const updatedProfile = await authService.updateProfile(userId, validatedInput);
    res.status(200).json(updatedProfile);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    if (error.message === 'Email is already taken by another user') {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
}
