import { ActivityEventType, Prisma } from '@prisma/client';
import { prisma } from '../prisma';

export interface RecordActivityParams {
  workItemId: string;
  actorId: string;
  eventType: ActivityEventType;
  oldState?: any;
  newState?: any;
  metadata?: any;
}

export async function recordActivityInTx(
  tx: Prisma.TransactionClient,
  params: RecordActivityParams
) {
  return tx.activityEvent.create({
    data: {
      workItemId: params.workItemId,
      actorId: params.actorId,
      eventType: params.eventType,
      oldState: params.oldState ?? Prisma.DbNull,
      newState: params.newState ?? Prisma.DbNull,
      metadata: params.metadata ?? Prisma.DbNull,
    },
  });
}

export async function getActivityHistory(workItemId: string) {
  return prisma.activityEvent.findMany({
    where: { workItemId },
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
