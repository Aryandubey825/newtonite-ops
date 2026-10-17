import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { getTestAuthToken, getTestTeam, getTestUser } from './helpers';
import { WorkItemPriority, WorkItemStatus, WorkItemType } from '@prisma/client';

describe('Critical Behavior 5: Resource-Level Authorization & Team Scoping', () => {
  let paymentsTeam: any;
  let secopsMemberToken: string;
  let secopsViewerToken: string;
  let paymentsMemberToken: string;
  let paymentItemId: string;

  beforeAll(async () => {
    paymentsTeam = await getTestTeam('payments');
    secopsMemberToken = await getTestAuthToken('member.secops@newtonite.io');
    secopsViewerToken = await getTestAuthToken('viewer.secops@newtonite.io');
    paymentsMemberToken = await getTestAuthToken('member.payments@newtonite.io');
    const paymentsUser = await getTestUser('member.payments@newtonite.io');

    const item = await prisma.workItem.create({
      data: {
        teamId: paymentsTeam.id,
        title: 'Confidential Payments Settlement Item',
        description: 'Sensitive banking ledger issue',
        type: WorkItemType.PAYMENT,
        priority: WorkItemPriority.HIGH,
        status: WorkItemStatus.OPEN,
        createdById: paymentsUser.id,
        assigneeId: null,
        version: 1,
      },
    });
    paymentItemId = item.id;
  });

  afterAll(async () => {
    if (paymentItemId) {
      await prisma.activityEvent.deleteMany({ where: { workItemId: paymentItemId } });
      await prisma.workItem.delete({ where: { id: paymentItemId } }).catch(() => {});
    }
  });

  it('rejects cross-team read attempt with 403 Forbidden', async () => {
    // SecOps member attempts to read a Payments work item
    const res = await request(app)
      .get(`/api/items/${paymentItemId}`)
      .set('Authorization', `Bearer ${secopsMemberToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('ForbiddenError');
    expect(res.body.message).toMatch(/do not belong to the team/i);
  });

  it('rejects cross-team mutation attempt with 403 Forbidden', async () => {
    // SecOps member attempts to claim a Payments work item
    const res = await request(app)
      .post(`/api/items/${paymentItemId}/claim`)
      .set('Authorization', `Bearer ${secopsMemberToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('ForbiddenError');
  });

  it('allows authorized Payments team member to read and claim the item', async () => {
    const res = await request(app)
      .post(`/api/items/${paymentItemId}/claim`)
      .set('Authorization', `Bearer ${paymentsMemberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.item.assigneeId).toBeTruthy();
  });
});
