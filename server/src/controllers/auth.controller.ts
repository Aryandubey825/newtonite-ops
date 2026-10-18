import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { login, getInviteInfo, acceptInvite } from '../services/auth.service';
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

export async function getInviteInfoController(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).json({ error: 'ValidationError', message: 'Token query parameter is required.' });
    }
    const info = await getInviteInfo(token);
    res.json(info);
  } catch (err) {
    next(err);
  }
}

export async function acceptInviteController(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password, fullName } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'ValidationError', message: 'Token and password are required.' });
    }
    const result = await acceptInvite(token, password, fullName);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
