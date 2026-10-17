import { Prisma, PrismaClient, OutboxStatus } from '@prisma/client';
import { prisma } from '../prisma';

export interface OutboxDispatcher {
  (eventType: string, payload: any): Promise<void>;
}

// Default mock dispatcher (simulates notifications, emails, webhooks)
export const defaultDispatcher: OutboxDispatcher = async (eventType: string, payload: any) => {
  // Simulates external async processing
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[Outbox Worker] Dispatched event: ${eventType}`, JSON.stringify(payload));
  }
};

let customDispatcher: OutboxDispatcher | null = null;

export function setCustomDispatcher(dispatcher: OutboxDispatcher | null) {
  customDispatcher = dispatcher;
}

export async function createOutboxJobInTx(
  tx: Prisma.TransactionClient,
  eventType: string,
  payload: any
) {
  return tx.outboxJob.create({
    data: {
      eventType,
      payload,
      status: OutboxStatus.PENDING,
      attempts: 0,
      maxAttempts: 5,
      nextRunAt: new Date(),
    },
  });
}

export async function processOutboxBatch(batchSize = 10, dbClient: PrismaClient = prisma): Promise<number> {
  const dispatcher = customDispatcher || defaultDispatcher;

  return dbClient.$transaction(async (tx) => {
    // Acquire exclusive row locks skipping already locked rows
    const jobs = await tx.$queryRaw<Array<{
      id: string;
      event_type: string;
      payload: any;
      attempts: number;
      max_attempts: number;
    }>>`
      SELECT id, event_type, payload, attempts, max_attempts
      FROM outbox_jobs
      WHERE status = 'PENDING'
        AND next_run_at <= NOW()
      ORDER BY created_at ASC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    `;

    if (jobs.length === 0) return 0;

    for (const job of jobs) {
      try {
        await dispatcher(job.event_type, job.payload);

        await tx.outboxJob.update({
          where: { id: job.id },
          data: {
            status: OutboxStatus.COMPLETED,
            updatedAt: new Date(),
          },
        });
      } catch (err: any) {
        const nextAttempts = job.attempts + 1;
        const errorMessage = err?.message || 'Unknown processing error';

        if (nextAttempts >= job.max_attempts) {
          // Dead-letter state: permanently failed
          await tx.outboxJob.update({
            where: { id: job.id },
            data: {
              status: OutboxStatus.FAILED,
              attempts: nextAttempts,
              lastError: errorMessage,
              updatedAt: new Date(),
            },
          });
        } else {
          // Exponential backoff: 2^attempts * 1000ms
          const backoffMs = Math.pow(2, nextAttempts) * 1000;
          const nextRunAt = new Date(Date.now() + backoffMs);

          await tx.outboxJob.update({
            where: { id: job.id },
            data: {
              status: OutboxStatus.PENDING,
              attempts: nextAttempts,
              nextRunAt,
              lastError: errorMessage,
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    return jobs.length;
  });
}
