import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { login } from '../services/auth.service';
import { AuthenticatedRequest } from '../types';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUserController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}
