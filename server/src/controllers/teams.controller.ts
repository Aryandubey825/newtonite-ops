import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  listTeams,
  createTeam,
  getTeamMembers,
  addOrUpdateTeamMember,
  removeTeamMember,
  listWorkspaceUsers,
} from '../services/team.service';

import { prisma } from '../prisma';

export async function listTeamsController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const teams = await listTeams(req.user!);
    const totalWorkspaceUsers = await prisma.user.count();
    res.json({ teams, totalWorkspaceUsers });
  } catch (err) {
    next(err);
  }
}

export async function createTeamController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name, slug, description } = req.body;
    const team = await createTeam(req.user!, { name, slug, description });
    res.status(201).json({ team });
  } catch (err) {
    next(err);
  }
}

export async function getTeamMembersController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { teamId } = req.params;
    const members = await getTeamMembers(teamId, req.user!);
    res.json({ members });
  } catch (err) {
    next(err);
  }
}

export async function addMemberController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { teamId } = req.params;
    const { userId, email, fullName, role } = req.body;
    const result = await addOrUpdateTeamMember(
      teamId,
      { userId, email, fullName },
      role,
      req.user!
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function removeMemberController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { teamId, userId } = req.params;
    await removeTeamMember(teamId, userId, req.user!);
    res.json({ success: true, message: 'Member successfully removed from team.' });
  } catch (err) {
    next(err);
  }
}

export async function listWorkspaceUsersController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const users = await listWorkspaceUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
}
