import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { getTestAuthToken, getTestTeam, getTestUser } from './helpers';
import { WorkItemPriority, WorkItemStatus, WorkItemType } from '@prisma/client';

describe('Critical Behavior 2: Optimistic Concurrency Control (OCC) & Stale Updates', () => {
  let secopsTeam: any;
  let memberToken: string;
  let testItemId: string;

  beforeAll(async () => {
    secopsTeam = await getTestTeam('secops');
    memberToken = await getTestAuthToken('member.secops@newtonite.io');
    const memberUser = await getTestUser('member.secops@newtonite.io');

    const item = await prisma.workItem.create({
      data: {
        teamId: secopsTeam.id,
        title: 'Original Title v1',
        description: 'Original Description',
        type: WorkItemType.TASK,
        priority: WorkItemPriority.MEDIUM,
        status: WorkItemStatus.IN_PROGRESS,
        createdById: memberUser.id,
        assigneeId: memberUser.id,
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

  it('successfully updates item when client version matches, incrementing version to 2', async () => {
    const res = await request(app)
      .patch(`/api/items/${testItemId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Updated Title by User A',
        version: 1, // Correct version
      });

    expect(res.status).toBe(200);
    expect(res.body.item.title).toBe('Updated Title by User A');
    expect(res.body.item.version).toBe(2);
  });

  it('rejects stale update with 409 Conflict when client sends obsolete version 1', async () => {
    // Attempt to update with stale version 1 (DB is now at version 2)
    const res = await request(app)
      .patch(`/api/items/${testItemId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Overwriting Title by Stale User B',
        version: 1, // STALE VERSION
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ConflictError');
    expect(res.body.message).toMatch(/stale update rejected/i);
    expect(res.body.details).toBeDefined();
    expect(res.body.details.clientVersion).toBe(1);
    expect(res.body.details.currentVersion).toBe(2);
    expect(res.body.details.currentItem.title).toBe('Updated Title by User A');

    // Confirm DB was untouched
    const dbItem = await prisma.workItem.findUnique({
      where: { id: testItemId },
    });
    expect(dbItem?.title).toBe('Updated Title by User A');
    expect(dbItem?.version).toBe(2);
  });
});
