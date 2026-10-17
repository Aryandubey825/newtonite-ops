import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedRequest } from '../types';
import { UnauthorizedError } from '../utils/errors';
import { getUserById } from '../services/auth.service';

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header.');
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch {
      throw new UnauthorizedError('Invalid or expired authentication token.');
    }

    const user = await getUserById(decoded.sub);
    if (!user) {
      throw new UnauthorizedError('User referenced by token does not exist.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
