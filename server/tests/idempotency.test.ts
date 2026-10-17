import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { getTestAuthToken, getTestTeam } from './helpers';
import crypto from 'crypto';

describe('Critical Behavior 3: Idempotency & Retry Deduplication', () => {
  let secopsTeam: any;
  let memberToken: string;
  let testKey: string;
  let createdItemId: string;

  beforeAll(async () => {
    secopsTeam = await getTestTeam('secops');
    memberToken = await getTestAuthToken('member.secops@newtonite.io');
    testKey = `idempotent-test-key-${crypto.randomUUID()}`;
  });

  afterAll(async () => {
    if (createdItemId) {
      await prisma.activityEvent.deleteMany({ where: { workItemId: createdItemId } });
      await prisma.workItem.delete({ where: { id: createdItemId } }).catch(() => {});
    }
    await prisma.idempotencyKey.delete({ where: { key: testKey } }).catch(() => {});
  });

  it('creates an item on the first request and returns 201 Created', async () => {
    const payload = {
      teamId: secopsTeam.id,
      title: 'Idempotency Validation Item',
      description: 'Testing duplicate request protection',
      priority: 'HIGH',
      type: 'TASK',
    };

    const res1 = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('Idempotency-Key', testKey)
      .send(payload);

    expect(res1.status).toBe(201);
    expect(res1.body.item).toBeDefined();
    createdItemId = res1.body.item.id;

    // Send the identical request with the exact same Idempotency-Key
    const res2 = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${memberToken}`)
      .set('Idempotency-Key', testKey)
      .send(payload);

    // Assert same status and identical response
    expect(res2.status).toBe(201);
    expect(res2.headers['x-idempotency-replay']).toBe('true');
    expect(res2.body.item.id).toBe(createdItemId);
    expect(res2.body.item.title).toBe(res1.body.item.title);

    // Assert database only has ONE item with this title
    const count = await prisma.workItem.count({
      where: {
        teamId: secopsTeam.id,
        title: 'Idempotency Validation Item',
      },
    });
    expect(count).toBe(1);
  });
});
