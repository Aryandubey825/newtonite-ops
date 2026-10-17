import { Router } from 'express';
import { loginController, getCurrentUserController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', loginController);
router.get('/me', authMiddleware, getCurrentUserController);

export default router;
