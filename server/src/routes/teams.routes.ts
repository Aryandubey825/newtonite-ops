import { Router } from 'express';
import {
  listTeamsController,
  createTeamController,
  getTeamMembersController,
  addMemberController,
  removeMemberController,
  listWorkspaceUsersController,
} from '../controllers/teams.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, listTeamsController);
router.post('/', authMiddleware, createTeamController);
router.get('/users/all', authMiddleware, listWorkspaceUsersController);
router.get('/:teamId/members', authMiddleware, getTeamMembersController);
router.post('/:teamId/members', authMiddleware, addMemberController);
router.delete('/:teamId/members/:userId', authMiddleware, removeMemberController);

export default router;
