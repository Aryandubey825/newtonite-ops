import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { getTestAuthToken, getTestTeam, getTestUser } from './helpers';
import { WorkItemPriority, WorkItemStatus, WorkItemType } from '@prisma/client';

describe('Critical Behavior 1: Concurrent Work Item Claiming', () => {
  let secopsTeam: any;
  let leadToken: string;
  let memberToken: string;
  let testItemId: string;

  beforeAll(async () => {
    secopsTeam = await getTestTeam('secops');
    leadToken = await getTestAuthToken('lead.secops@newtonite.io');
    memberToken = await getTestAuthToken('member.secops@newtonite.io');

    const leadUser = await getTestUser('lead.secops@newtonite.io');

    // Create a pristine unassigned work item
    const item = await prisma.workItem.create({
      data: {
        teamId: secopsTeam.id,
        title: 'Concurrent Race Condition Test Item',
        description: 'Two operators will simultaneously attempt to claim this item.',
        type: WorkItemType.INCIDENT,
        priority: WorkItemPriority.URGENT,
        status: WorkItemStatus.OPEN,
        createdById: leadUser.id,
        assigneeId: null,
        version: 1,
      },
    });
    testItemId = item.id;
  });

  afterAll(async () => {
    if (testItemId) {
      await prisma.activityEvent.deleteMany({ where: { workItemId: testItemId } });
      await prisma.workItem.delete({ where: { id: testItemId } }).catch(() => {});
    }
  });

  it('handles parallel claims atomically: exactly one succeeds with 200, one receives 409 Conflict', async () => {
    // Fire two claim requests concurrently
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/items/${testItemId}/claim`)
        .set('Authorization', `Bearer ${leadToken}`),
      request(app)
        .post(`/api/items/${testItemId}/claim`)
        .set('Authorization', `Bearer ${memberToken}`),
    ]);

    const statuses = [res1.status, res2.status].sort();

    // Exactly one must be 200 OK and one must be 409 Conflict
    expect(statuses).toEqual([200, 409]);

    const winnerRes = res1.status === 200 ? res1 : res2;
    const loserRes = res1.status === 409 ? res1 : res2;

    expect(winnerRes.body.item.status).toBe('IN_PROGRESS');
    expect(winnerRes.body.item.assigneeId).toBeTruthy();

    expect(loserRes.body.error).toBe('ConflictError');
    expect(loserRes.body.message).toMatch(/already claimed/i);

    // Verify DB state integrity
    const dbItem = await prisma.workItem.findUnique({
      where: { id: testItemId },
    });
    expect(dbItem?.status).toBe('IN_PROGRESS');
    expect(dbItem?.assigneeId).toBe(winnerRes.body.item.assigneeId);

    // Verify only 1 claim activity event was logged
    const activityEvents = await prisma.activityEvent.findMany({
      where: { workItemId: testItemId, eventType: 'ASSIGNED' },
    });
    expect(activityEvents.length).toBe(1);
  });
});
