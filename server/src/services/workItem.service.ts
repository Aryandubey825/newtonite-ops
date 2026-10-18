import { ActivityEventType, Prisma, TeamRole, WorkItemPriority, WorkItemStatus, WorkItemType } from '@prisma/client';
import { prisma } from '../prisma';
import { AuthUser, CreateWorkItemDTO, UpdateWorkItemDTO, WorkItemListQuery } from '../types';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { decodeCursor, encodeCursor } from '../utils/cursor';
import { validateStateTransition } from './workflow.service';
import { recordActivityInTx } from './activity.service';
import { createOutboxJobInTx } from './outbox.service';

/**
 * Resolves user role within a specific team.
 */
export function getUserTeamRole(user: AuthUser, teamId: string): TeamRole | null {
  const adminMembership = user.memberships.find((m) => m.role === TeamRole.ADMIN);
  if (adminMembership) return TeamRole.ADMIN;

  const membership = user.memberships.find((m) => m.teamId === teamId);
  return membership ? membership.role : null;
}

/**
 * Asserts minimum team role, throws 403 Forbidden otherwise.
 */
export function assertMinimumRole(userRole: TeamRole | null, minRole: TeamRole): void {
  if (!userRole) {
    throw new ForbiddenError('You do not belong to the team that owns this work item.');
  }

  const roleHierarchy: Record<TeamRole, number> = {
    [TeamRole.VIEWER]: 10,
    [TeamRole.MEMBER]: 20,
    [TeamRole.LEAD]: 30,
    [TeamRole.ADMIN]: 40,
  };

  if (roleHierarchy[userRole] < roleHierarchy[minRole]) {
    throw new ForbiddenError(`Insufficient permissions. Required role: ${minRole}, your role: ${userRole}`);
  }
}

/**
 * Lists work items with server-side filtering, view presets, and scale-aware cursor pagination.
 */
export async function listWorkItems(query: WorkItemListQuery, user: AuthUser) {
  const userTeamIds = user.memberships.map((m) => m.teamId);
  const isAdmin = user.memberships.some((m) => m.role === TeamRole.ADMIN);

  const where: Prisma.WorkItemWhereInput = {};

  // Team scoping
  const baseTeamWhere: any = {};
  if (query.teamId) {
    if (!isAdmin && !userTeamIds.includes(query.teamId)) {
      throw new ForbiddenError('You do not have access to this team.');
    }
    where.teamId = query.teamId;
    baseTeamWhere.teamId = query.teamId;
  } else if (!isAdmin) {
    where.teamId = { in: userTeamIds };
    baseTeamWhere.teamId = { in: userTeamIds };
  }

  // View presets
  if (query.view === 'assigned_to_me') {
    where.assigneeId = user.id;
    where.status = { notIn: [WorkItemStatus.CLOSED, WorkItemStatus.CANCELLED] };
  } else if (query.view === 'unassigned_urgent') {
    where.assigneeId = null;
    where.priority = WorkItemPriority.URGENT;
    where.status = WorkItemStatus.OPEN;
  } else if (query.view === 'awaiting_approval') {
    where.status = WorkItemStatus.AWAITING_APPROVAL;
    // Only show items where user is LEAD or ADMIN in that team
    if (!isAdmin) {
      const leadTeamIds = user.memberships
        .filter((m) => m.role === TeamRole.LEAD || m.role === TeamRole.ADMIN)
        .map((m) => m.teamId);
      where.teamId = { in: leadTeamIds };
    }
  }

  // Filters
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.type) where.type = query.type;
  if (query.assigneeId) where.assigneeId = query.assigneeId;

  // Search filter
  if (query.search && query.search.trim() !== '') {
    const term = query.search.trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ];
  }

  // Cursor pagination
  const limit = Math.min(Math.max(query.limit || 20, 1), 100);
  if (query.cursor) {
    const decoded = decodeCursor(query.cursor);
    if (decoded) {
      where.AND = [
        {
          OR: [
            { createdAt: { lt: decoded.createdAt } },
            {
              createdAt: decoded.createdAt,
              id: { lt: decoded.id },
            },
          ],
        },
      ];
    }
  }

  const leadTeamIds = user.memberships
    .filter((m) => m.role === TeamRole.LEAD || m.role === TeamRole.ADMIN)
    .map((m) => m.teamId);

  const [items, totalCount, allCount, assignedCount, urgentCount, approvalCount] = await Promise.all([
    prisma.workItem.findMany({
      where,
      take: limit + 1,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      include: {
        team: { select: { id: true, name: true, slug: true } },
        assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.workItem.count({ where }),
    prisma.workItem.count({ where: baseTeamWhere }),
    prisma.workItem.count({
      where: {
        ...baseTeamWhere,
        assigneeId: user.id,
        status: { notIn: [WorkItemStatus.CLOSED, WorkItemStatus.CANCELLED] },
      },
    }),
    prisma.workItem.count({
      where: {
        ...baseTeamWhere,
        assigneeId: null,
        priority: WorkItemPriority.URGENT,
        status: WorkItemStatus.OPEN,
      },
    }),
    prisma.workItem.count({
      where: {
        ...baseTeamWhere,
        status: WorkItemStatus.AWAITING_APPROVAL,
        ...(isAdmin ? {} : { teamId: { in: leadTeamIds } }),
      },
    }),
  ]);

  let nextCursor: string | null = null;
  let hasMore = false;

  if (items.length > limit) {
    hasMore = true;
    const lastItem = items.pop()!;
    nextCursor = encodeCursor({ createdAt: lastItem.createdAt, id: lastItem.id });
  }

  return {
    items,
    nextCursor,
    hasMore,
    totalCount,
    tabCounts: {
      all: allCount,
      assigned_to_me: assignedCount,
      unassigned_urgent: urgentCount,
      awaiting_approval: approvalCount,
    },
  };
}

/**
 * Retrieves a single work item by ID with permission checks.
 */
export async function getWorkItemById(id: string, user: AuthUser) {
  const item = await prisma.workItem.findUnique({
    where: { id },
    include: {
      team: true,
      assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      createdBy: { select: { id: true, fullName: true, email: true } },
      comments: {
        include: {
          author: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!item) {
    throw new NotFoundError('Work item not found');
  }

  const role = getUserTeamRole(user, item.teamId);
  assertMinimumRole(role, TeamRole.VIEWER);

  return item;
}

/**
 * Creates a new work item inside a transaction along with activity log and outbox job.
 */
export async function createWorkItem(dto: CreateWorkItemDTO, user: AuthUser) {
  const role = getUserTeamRole(user, dto.teamId);
  assertMinimumRole(role, TeamRole.MEMBER);

  return prisma.$transaction(async (tx) => {
    const item = await tx.workItem.create({
      data: {
        teamId: dto.teamId,
        title: dto.title,
        description: dto.description,
        type: dto.type || WorkItemType.TASK,
        priority: dto.priority || WorkItemPriority.MEDIUM,
        status: WorkItemStatus.OPEN,
        createdById: user.id,
        assigneeId: dto.assigneeId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        version: 1,
      },
      include: {
        team: true,
        assignee: { select: { id: true, fullName: true, email: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Append-only activity log
    await recordActivityInTx(tx, {
      workItemId: item.id,
      actorId: user.id,
      eventType: ActivityEventType.CREATED,
      newState: {
        title: item.title,
        status: item.status,
        priority: item.priority,
        type: item.type,
        assigneeId: item.assigneeId,
      },
    });

    // Transactional outbox
    await createOutboxJobInTx(tx, 'WORK_ITEM_CREATED', {
      itemId: item.id,
      teamId: item.teamId,
      title: item.title,
      createdById: user.id,
      priority: item.priority,
    });

    return item;
  });
}

/**
 * Atomically claims an unassigned work item.
 * Guarantees zero double-claims under high concurrency.
 */
export async function claimWorkItem(id: string, user: AuthUser) {
  // Pre-load to verify team authorization
  const initial = await prisma.workItem.findUnique({
    where: { id },
    select: { teamId: true },
  });

  if (!initial) {
    throw new NotFoundError('Work item not found');
  }

  const role = getUserTeamRole(user, initial.teamId);
  assertMinimumRole(role, TeamRole.MEMBER);

  return prisma.$transaction(async (tx) => {
    // Atomic conditional write: update only if unassigned and in OPEN status
    const result = await tx.workItem.updateMany({
      where: {
        id,
        assigneeId: null,
        status: WorkItemStatus.OPEN,
      },
      data: {
        assigneeId: user.id,
        status: WorkItemStatus.IN_PROGRESS,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      // Fetch latest state to diagnose reason for conflict
      const current = await tx.workItem.findUnique({
        where: { id },
        include: { assignee: { select: { id: true, fullName: true } } },
      });

      if (!current) throw new NotFoundError('Work item not found');
      if (current.assigneeId) {
        throw new ConflictError(
          `This item was already claimed by ${current.assignee?.fullName || 'another operator'}.`,
          { currentItem: current }
        );
      }
      throw new ConflictError(
        `Item cannot be claimed because its status is '${current.status}'. Only OPEN items can be claimed.`,
        { currentItem: current }
      );
    }

    // Co-transactional activity event
    await recordActivityInTx(tx, {
      workItemId: id,
      actorId: user.id,
      eventType: ActivityEventType.ASSIGNED,
      oldState: { assigneeId: null, status: WorkItemStatus.OPEN },
      newState: { assigneeId: user.id, status: WorkItemStatus.IN_PROGRESS },
      metadata: { action: 'CLAIMED' },
    });

    // Transactional outbox
    await createOutboxJobInTx(tx, 'WORK_ITEM_CLAIMED', {
      itemId: id,
      assigneeId: user.id,
      actorId: user.id,
    });

    return tx.workItem.findUnique({
      where: { id },
      include: {
        team: true,
        assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  });
}

/**
 * Updates work item fields using Optimistic Concurrency Control (OCC).
 * Rejects stale versions with 409 Conflict containing latest DB state.
 */
export async function updateWorkItem(id: string, dto: UpdateWorkItemDTO, user: AuthUser) {
  if (dto.version === undefined || typeof dto.version !== 'number') {
    throw new ValidationError('Version number is required for optimistic concurrency control.');
  }

  const initial = await prisma.workItem.findUnique({
    where: { id },
    select: { teamId: true },
  });

  if (!initial) {
    throw new NotFoundError('Work item not found');
  }

  const role = getUserTeamRole(user, initial.teamId);
  assertMinimumRole(role, TeamRole.MEMBER);

  return prisma.$transaction(async (tx) => {
    // Check current state and version
    const existing = await tx.workItem.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!existing) throw new NotFoundError('Work item not found');

    if (existing.version !== dto.version) {
      throw new ConflictError(
        `Stale update rejected: work item was modified by another operator (client version: ${dto.version}, server version: ${existing.version}).`,
        {
          clientVersion: dto.version,
          currentVersion: existing.version,
          currentItem: existing,
        }
      );
    }

    const updateData: Prisma.WorkItemUpdateInput = {
      version: { increment: 1 },
    };

    const diff: Record<string, { old: any; new: any }> = {};

    if (dto.title !== undefined && dto.title !== existing.title) {
      updateData.title = dto.title;
      diff.title = { old: existing.title, new: dto.title };
    }
    if (dto.description !== undefined && dto.description !== existing.description) {
      updateData.description = dto.description;
      diff.description = { old: existing.description, new: dto.description };
    }
    if (dto.type !== undefined && dto.type !== existing.type) {
      updateData.type = dto.type;
      diff.type = { old: existing.type, new: dto.type };
    }
    if (dto.priority !== undefined && dto.priority !== existing.priority) {
      updateData.priority = dto.priority;
      diff.priority = { old: existing.priority, new: dto.priority };
    }
    if (dto.dueDate !== undefined) {
      const parsed = dto.dueDate ? new Date(dto.dueDate) : null;
      updateData.dueDate = parsed;
      diff.dueDate = { old: existing.dueDate, new: parsed };
    }
    if (dto.assigneeId !== undefined && dto.assigneeId !== existing.assigneeId) {
      updateData.assignee = dto.assigneeId ? { connect: { id: dto.assigneeId } } : { disconnect: true };
      diff.assigneeId = { old: existing.assigneeId, new: dto.assigneeId };
    }

    const updated = await tx.workItem.update({
      where: { id },
      data: updateData,
      include: {
        team: true,
        assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Record activity event
    if (Object.keys(diff).length > 0) {
      let eventType: ActivityEventType = ActivityEventType.DETAILS_UPDATED;
      if (diff.priority) eventType = ActivityEventType.PRIORITY_CHANGED;
      else if (diff.assigneeId) eventType = ActivityEventType.ASSIGNED;

      await recordActivityInTx(tx, {
        workItemId: id,
        actorId: user.id,
        eventType,
        oldState: Object.fromEntries(Object.entries(diff).map(([k, v]) => [k, v.old])),
        newState: Object.fromEntries(Object.entries(diff).map(([k, v]) => [k, v.new])),
      });

      // Transactional outbox
      await createOutboxJobInTx(tx, 'WORK_ITEM_UPDATED', {
        itemId: id,
        changes: Object.keys(diff),
        actorId: user.id,
      });
    }

    return updated;
  });
}

/**
 * Transitions work item workflow state with strict server-side state machine and Lead approval gate.
 */
export async function transitionWorkItem(
  id: string,
  targetStatus: WorkItemStatus,
  user: AuthUser,
  commentText?: string
) {
  const item = await prisma.workItem.findUnique({
    where: { id },
  });

  if (!item) {
    throw new NotFoundError('Work item not found');
  }

  const role = getUserTeamRole(user, item.teamId);
  if (!role) {
    throw new ForbiddenError('You do not have access to this team.');
  }

  // Pure domain state-machine validation
  validateStateTransition(item.status, targetStatus, role);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.workItem.update({
      where: { id },
      data: {
        status: targetStatus,
        version: { increment: 1 },
      },
      include: {
        team: true,
        assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Record state change activity
    await recordActivityInTx(tx, {
      workItemId: id,
      actorId: user.id,
      eventType: ActivityEventType.STATUS_TRANSITION,
      oldState: { status: item.status },
      newState: { status: targetStatus },
      metadata: { userRole: role, comment: commentText },
    });

    // Optional comment
    if (commentText && commentText.trim() !== '') {
      await tx.comment.create({
        data: {
          workItemId: id,
          authorId: user.id,
          content: commentText.trim(),
        },
      });
    }

    // Transactional outbox
    await createOutboxJobInTx(tx, 'WORK_ITEM_STATUS_CHANGED', {
      itemId: id,
      fromStatus: item.status,
      toStatus: targetStatus,
      actorId: user.id,
    });

    return updated;
  });
}

/**
 * Adds a comment to a work item and logs it in the activity timeline.
 */
export async function addComment(id: string, content: string, user: AuthUser) {
  if (!content || content.trim() === '') {
    throw new ValidationError('Comment content cannot be empty.');
  }

  const item = await prisma.workItem.findUnique({
    where: { id },
    select: { teamId: true },
  });

  if (!item) {
    throw new NotFoundError('Work item not found');
  }

  const role = getUserTeamRole(user, item.teamId);
  assertMinimumRole(role, TeamRole.MEMBER);

  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        workItemId: id,
        authorId: user.id,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
    });

    await recordActivityInTx(tx, {
      workItemId: id,
      actorId: user.id,
      eventType: ActivityEventType.COMMENT_ADDED,
      newState: { commentId: comment.id, snippet: content.slice(0, 100) },
    });

    return comment;
  });
}
