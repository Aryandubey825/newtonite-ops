import { TeamRole, WorkItemStatus } from '@prisma/client';
import { ForbiddenError, UnprocessableEntityError } from '../utils/errors';

export const ALLOWED_TRANSITIONS: Record<WorkItemStatus, WorkItemStatus[]> = {
  [WorkItemStatus.OPEN]: [
    WorkItemStatus.IN_PROGRESS,
    WorkItemStatus.CANCELLED,
  ],
  [WorkItemStatus.IN_PROGRESS]: [
    WorkItemStatus.AWAITING_APPROVAL,
    WorkItemStatus.RESOLVED,
    WorkItemStatus.CANCELLED,
  ],
  [WorkItemStatus.AWAITING_APPROVAL]: [
    WorkItemStatus.RESOLVED,
    WorkItemStatus.IN_PROGRESS,
  ],
  [WorkItemStatus.RESOLVED]: [
    WorkItemStatus.CLOSED,
    WorkItemStatus.IN_PROGRESS,
  ],
  [WorkItemStatus.CLOSED]: [],
  [WorkItemStatus.CANCELLED]: [],
};

export function validateStateTransition(
  currentStatus: WorkItemStatus,
  targetStatus: WorkItemStatus,
  userRole: TeamRole
): void {
  // 1. Check if terminal state
  if (currentStatus === WorkItemStatus.CLOSED || currentStatus === WorkItemStatus.CANCELLED) {
    throw new UnprocessableEntityError(`Item is in terminal state '${currentStatus}' and cannot be transitioned.`);
  }

  // 2. Check transition graph
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    throw new UnprocessableEntityError(
      `Illegal workflow transition from '${currentStatus}' to '${targetStatus}'. Allowed target states: [${allowedNext.join(', ')}]`
    );
  }

  // 3. Viewers cannot transition any item
  if (userRole === TeamRole.VIEWER) {
    throw new ForbiddenError('Viewers do not have permission to transition work items.');
  }

  // 4. Critical Gate: Approval Step (AWAITING_APPROVAL -> RESOLVED)
  // Only a LEAD or ADMIN can pass this approval gate!
  if (currentStatus === WorkItemStatus.AWAITING_APPROVAL && targetStatus === WorkItemStatus.RESOLVED) {
    if (userRole !== TeamRole.LEAD && userRole !== TeamRole.ADMIN) {
      throw new ForbiddenError('Only Team Leads or Admins can approve work items awaiting approval.');
    }
  }

  // 5. Direct Resolve from IN_PROGRESS without approval is also a Lead-only shortcut
  if (currentStatus === WorkItemStatus.IN_PROGRESS && targetStatus === WorkItemStatus.RESOLVED) {
    if (userRole !== TeamRole.LEAD && userRole !== TeamRole.ADMIN) {
      throw new ForbiddenError('Direct resolution without approval review is restricted to Team Leads and Admins.');
    }
  }

  // 6. Closure or Cancellation requires Lead or Admin
  if (targetStatus === WorkItemStatus.CLOSED || targetStatus === WorkItemStatus.CANCELLED) {
    if (userRole !== TeamRole.LEAD && userRole !== TeamRole.ADMIN) {
      throw new ForbiddenError(`Only Team Leads or Admins can set item to '${targetStatus}'.`);
    }
  }
}
