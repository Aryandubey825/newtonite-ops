import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { getAllTeams } from '../services/auth.service';

export async function listTeamsController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const teams = await getAllTeams(req.user!);
    res.json({ teams });
  } catch (err) {
    next(err);
  }
}
