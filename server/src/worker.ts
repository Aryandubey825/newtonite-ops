import { processOutboxBatch } from './services/outbox.service';

let isRunning = false;
let timeoutHandle: NodeJS.Timeout | null = null;

export async function runWorkerIteration() {
  try {
    const processed = await processOutboxBatch(10);
    if (processed > 0 && process.env.NODE_ENV !== 'test') {
      console.log(`[Outbox Worker] Successfully processed ${processed} background outbox job(s).`);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[Outbox Worker] Error during polling iteration:', err);
    }
  }
}

export function startOutboxWorker(intervalMs = 2000) {
  if (isRunning) return;
  isRunning = true;
  console.log(`🚀 Transactional Outbox Worker started (polling every ${intervalMs}ms)...`);

  const poll = async () => {
    if (!isRunning) return;
    await runWorkerIteration();
    if (isRunning) {
      timeoutHandle = setTimeout(poll, intervalMs);
    }
  };

  poll();
}

export function stopOutboxWorker() {
  isRunning = false;
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }
  console.log('🛑 Transactional Outbox Worker stopped.');
}

// Standalone execution support
if (require.main === module) {
  startOutboxWorker();

  const shutdown = () => {
    stopOutboxWorker();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
