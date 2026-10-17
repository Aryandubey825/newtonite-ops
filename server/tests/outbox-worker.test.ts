import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/prisma';
import {
  createOutboxJobInTx,
  processOutboxBatch,
  setCustomDispatcher,
} from '../src/services/outbox.service';
import { OutboxStatus } from '@prisma/client';

describe('Critical Behavior 6: Reliable Async Work (Transactional Outbox)', () => {
  let createdJobId: string;

  beforeAll(async () => {
    await prisma.outboxJob.deleteMany();
  });

  afterAll(async () => {
    setCustomDispatcher(null);
    if (createdJobId) {
      await prisma.outboxJob.delete({ where: { id: createdJobId } }).catch(() => {});
    }
  });

  it('processes a pending outbox job successfully and updates status to COMPLETED', async () => {
    let dispatchedCount = 0;
    setCustomDispatcher(async (eventType, payload) => {
      dispatchedCount++;
    });

    // Enqueue an outbox job inside a transaction
    const job = await prisma.$transaction(async (tx) => {
      return createOutboxJobInTx(tx, 'TEST_NOTIFICATION_EVENT', {
        userId: 'user-123',
        message: 'Hello outbox',
      });
    });
    createdJobId = job.id;

    // Run one iteration of the worker
    const processed = await processOutboxBatch(10);
    expect(processed).toBeGreaterThanOrEqual(1);
    expect(dispatchedCount).toBe(1);

    // Verify DB status
    const dbJob = await prisma.outboxJob.findUnique({
      where: { id: createdJobId },
    });
    expect(dbJob?.status).toBe(OutboxStatus.COMPLETED);
  });

  it('retries failing jobs with exponential backoff and caps at maxAttempts (FAILED state)', async () => {
    let failureAttempts = 0;
    setCustomDispatcher(async () => {
      failureAttempts++;
      throw new Error('External notification service network timeout');
    });

    const failingJob = await prisma.$transaction(async (tx) => {
      return createOutboxJobInTx(tx, 'FAILING_EVENT', { target: 'downstream-api' });
    });

    // Loop through 5 attempts
    for (let i = 1; i <= 5; i++) {
      // Force nextRunAt to NOW so worker picks it up
      await prisma.outboxJob.update({
        where: { id: failingJob.id },
        data: { nextRunAt: new Date(Date.now() - 1000) },
      });

      await processOutboxBatch(10);

      const current = await prisma.outboxJob.findUnique({
        where: { id: failingJob.id },
      });

      if (i < 5) {
        expect(current?.status).toBe(OutboxStatus.PENDING);
        expect(current?.attempts).toBe(i);
        expect(current?.lastError).toContain('network timeout');
      } else {
        // Capped at 5 attempts -> transitions to FAILED
        expect(current?.status).toBe(OutboxStatus.FAILED);
        expect(current?.attempts).toBe(5);
        expect(current?.lastError).toContain('network timeout');
      }
    }

    // Clean up failing job
    await prisma.outboxJob.delete({ where: { id: failingJob.id } }).catch(() => {});
  });
});
