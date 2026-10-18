import { Router } from 'express';
import {
  loginController,
  getCurrentUserController,
  getInviteInfoController,
  acceptInviteController,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', loginController);
router.get('/me', authMiddleware, getCurrentUserController);
router.get('/invite-info', getInviteInfoController);
router.post('/accept-invite', acceptInviteController);

export default router;
