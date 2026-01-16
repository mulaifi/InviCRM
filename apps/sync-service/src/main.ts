import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
import { dataSource } from '@invicrm/database';
import { EmailSyncWorker } from './workers/email-sync.worker';
import { CalendarSyncWorker } from './workers/calendar-sync.worker';
import { EmailSyncScheduler } from './schedulers/email-sync.scheduler';

config();

async function bootstrap() {
  console.log('Starting InviCRM Sync Service...');

  // Initialize database connection
  const db = new DataSource({
    ...dataSource.options,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5433', 10),
    username: process.env.DATABASE_USER || 'invicrm',
    password: process.env.DATABASE_PASSWORD || 'invicrm_dev',
    database: process.env.DATABASE_NAME || 'invicrm',
  } as any);

  await db.initialize();
  console.log('Database connected');

  // Initialize Redis connection
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  });

  console.log('Redis connected');

  // Start workers
  const emailWorker = new EmailSyncWorker(db, redis);
  const calendarWorker = new CalendarSyncWorker(db, redis);

  emailWorker.start();
  calendarWorker.start();

  console.log('Workers started');

  // Start scheduler for periodic syncs
  const scheduler = new EmailSyncScheduler(redis);
  await scheduler.start();

  console.log('Scheduler started');
  console.log('InviCRM Sync Service is running');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    await emailWorker.stop();
    await calendarWorker.stop();
    await scheduler.stop();
    await redis.quit();
    await db.destroy();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start sync service:', err);
  process.exit(1);
});
