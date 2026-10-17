import { app } from './app';
import { config } from './config';
import { startOutboxWorker, stopOutboxWorker } from './worker';
import { prisma } from './prisma';

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🔥 Newtonite Operations Server active on port ${config.port}`);
  console.log(`   Healthcheck: http://localhost:${config.port}/health`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`====================================================`);

  // Start background outbox polling worker
  startOutboxWorker(2000);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  stopOutboxWorker();
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection released. Process exit.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
