import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { getTestAuthToken, getTestTeam, getTestUser } from './helpers';
import { WorkItemPriority, WorkItemStatus, WorkItemType } from '@prisma/client';

describe('Critical Behavior 4: Workflow Rules & Lead Approval Enforcement', () => {
  let secopsTeam: any;
  let leadToken: string;
  let memberToken: string;
  let viewerToken: string;
  let testItemId: string;

  beforeAll(async () => {
    secopsTeam = await getTestTeam('secops');
    leadToken = await getTestAuthToken('lead.secops@newtonite.io');
    memberToken = await getTestAuthToken('member.secops@newtonite.io');
    viewerToken = await getTestAuthToken('viewer.secops@newtonite.io');
    const memberUser = await getTestUser('member.secops@newtonite.io');

    const item = await prisma.workItem.create({
      data: {
        teamId: secopsTeam.id,
        title: 'Workflow State Machine Item',
        description: 'Testing valid and forbidden transitions',
        type: WorkItemType.TASK,
        priority: WorkItemPriority.HIGH,
        status: WorkItemStatus.OPEN,
        createdById: memberUser.id,
        assigneeId: memberUser.id,
        version: 1,
      },
    });
    testItemId = item.id;
  });

  afterAll(async () => {
    if (testItemId) {
      await prisma.comment.deleteMany({ where: { workItemId: testItemId } });
      await prisma.activityEvent.deleteMany({ where: { workItemId: testItemId } });
      await prisma.workItem.delete({ where: { id: testItemId } }).catch(() => {});
    }
  });

  it('rejects an invalid skip-transition from OPEN to CLOSED with 422 Unprocessable Entity', async () => {
    const res = await request(app)
      .post(`/api/items/${testItemId}/transition`)
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        status: 'CLOSED', // Illegal jump from OPEN directly to CLOSED
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('UnprocessableEntityError');
    expect(res.body.message).toMatch(/illegal workflow transition/i);
  });

  it('allows valid transition from OPEN to IN_PROGRESS', async () => {
    const res = await request(app)
      .post(`/api/items/${testItemId}/transition`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        status: 'IN_PROGRESS',
      });

    expect(res.status).toBe(200);
    expect(res.body.item.status).toBe('IN_PROGRESS');
  });

  it('allows member to submit item to AWAITING_APPROVAL', async () => {
    const res = await request(app)
      .post(`/api/items/${testItemId}/transition`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        status: 'AWAITING_APPROVAL',
      });

    expect(res.status).toBe(200);
    expect(res.body.item.status).toBe('AWAITING_APPROVAL');
  });

  it('rejects approval from non-Lead (Member) with 403 Forbidden', async () => {
    const res = await request(app)
      .post(`/api/items/${testItemId}/transition`)
      .set('Authorization', `Bearer ${memberToken}`) // MEMBER trying to approve
      .send({
        status: 'RESOLVED',
        comment: 'Attempting to self-approve without lead role',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('ForbiddenError');
    expect(res.body.message).toMatch(/only team leads or admins can approve/i);
  });

  it('allows Team Lead to successfully approve item to RESOLVED', async () => {
    const res = await request(app)
      .post(`/api/items/${testItemId}/transition`)
      .set('Authorization', `Bearer ${leadToken}`) // LEAD approving
      .send({
        status: 'RESOLVED',
        comment: 'Verified solution and approved resolution.',
      });

    expect(res.status).toBe(200);
    expect(res.body.item.status).toBe('RESOLVED');

    // Confirm comment was created
    const comments = await prisma.comment.findMany({
      where: { workItemId: testItemId },
    });
    expect(comments.some((c) => c.content.includes('Verified solution'))).toBe(true);
  });
});
