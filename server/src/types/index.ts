import { Request } from 'express';
import { TeamRole, WorkItemPriority, WorkItemStatus, WorkItemType } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  memberships: {
    teamId: string;
    teamName: string;
    teamSlug: string;
    role: TeamRole;
  }[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  idempotencyKey?: string;
}

export interface CreateWorkItemDTO {
  teamId: string;
  title: string;
  description?: string;
  type?: WorkItemType;
  priority?: WorkItemPriority;
  dueDate?: string;
  assigneeId?: string;
}

export interface UpdateWorkItemDTO {
  title?: string;
  description?: string;
  type?: WorkItemType;
  priority?: WorkItemPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
  version: number; // Mandatory for OCC
}

export interface WorkItemListQuery {
  teamId?: string;
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  type?: WorkItemType;
  assigneeId?: string;
  search?: string;
  cursor?: string;
  limit?: number;
  view?: 'assigned_to_me' | 'unassigned_urgent' | 'awaiting_approval';
}
