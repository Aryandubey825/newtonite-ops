import { Router } from 'express';
import { listTeamsController } from '../controllers/teams.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, listTeamsController);

export default router;
