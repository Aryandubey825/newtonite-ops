import { Response, NextFunction } from 'express';
import { TeamRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { assertMinimumRole, getUserTeamRole } from '../services/workItem.service';

export function requireTeamRole(minRole: TeamRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const teamId = (req.body && req.body.teamId) || req.query.teamId || req.params.teamId;
    if (!teamId || typeof teamId !== 'string') {
      return next(); // If route itself looks up teamId from entity, let controller handle it
    }

    try {
      const userRole = getUserTeamRole(req.user, teamId);
      assertMinimumRole(userRole, minRole);
      next();
    } catch (err) {
      next(err);
    }
  };
}
