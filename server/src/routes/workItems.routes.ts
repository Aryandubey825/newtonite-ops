import { Router } from 'express';
import {
  listWorkItemsController,
  getWorkItemController,
  createWorkItemController,
  updateWorkItemController,
  claimWorkItemController,
  transitionWorkItemController,
  getActivityController,
  addCommentController,
} from '../controllers/workItems.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', listWorkItemsController);
router.post('/', idempotencyMiddleware, createWorkItemController);
router.get('/:id', getWorkItemController);
router.patch('/:id', idempotencyMiddleware, updateWorkItemController);
router.post('/:id/claim', claimWorkItemController);
router.post('/:id/transition', transitionWorkItemController);
router.get('/:id/activity', getActivityController);
router.post('/:id/comments', addCommentController);

export default router;
