import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types';
import * as workItemService from '../services/workItem.service';
import { getActivityHistory } from '../services/activity.service';
import { WorkItemPriority, WorkItemStatus, WorkItemType } from '@prisma/client';

const createWorkItemSchema = z.object({
  teamId: z.string().uuid(),
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  type: z.nativeEnum(WorkItemType).optional(),
  priority: z.nativeEnum(WorkItemPriority).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
});

const updateWorkItemSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  type: z.nativeEnum(WorkItemType).optional(),
  priority: z.nativeEnum(WorkItemPriority).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  version: z.number().int().min(1), // Mandatory for OCC
});

const transitionSchema = z.object({
  status: z.nativeEnum(WorkItemStatus),
  comment: z.string().optional(),
});

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function listWorkItemsController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const query = {
      teamId: req.query.teamId as string | undefined,
      status: req.query.status as WorkItemStatus | undefined,
      priority: req.query.priority as WorkItemPriority | undefined,
      type: req.query.type as WorkItemType | undefined,
      assigneeId: req.query.assigneeId as string | undefined,
      search: req.query.search as string | undefined,
      cursor: req.query.cursor as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      view: req.query.view as any,
    };

    const result = await workItemService.listWorkItems(query, req.user!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getWorkItemController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await workItemService.getWorkItemById(req.params.id, req.user!);
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

export async function createWorkItemController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createWorkItemSchema.parse(req.body);
    const item = await workItemService.createWorkItem(parsed as any, req.user!);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function updateWorkItemController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateWorkItemSchema.parse(req.body);
    const item = await workItemService.updateWorkItem(req.params.id, parsed as any, req.user!);
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

export async function claimWorkItemController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await workItemService.claimWorkItem(req.params.id, req.user!);
    res.json({ item, message: 'Work item successfully claimed.' });
  } catch (err) {
    next(err);
  }
}

export async function transitionWorkItemController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status, comment } = transitionSchema.parse(req.body);
    const item = await workItemService.transitionWorkItem(req.params.id, status, req.user!, comment);
    res.json({ item, message: `Work item transitioned to ${status}.` });
  } catch (err) {
    next(err);
  }
}

export async function getActivityController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check view permission on item first
    await workItemService.getWorkItemById(req.params.id, req.user!);
    const activities = await getActivityHistory(req.params.id);
    res.json({ activities });
  } catch (err) {
    next(err);
  }
}

export async function addCommentController(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { content } = commentSchema.parse(req.body);
    const comment = await workItemService.addComment(req.params.id, content, req.user!);
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}
