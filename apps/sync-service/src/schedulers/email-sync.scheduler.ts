import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export class EmailSyncScheduler {
  private emailQueue: Queue;
  private calendarQueue: Queue;

  constructor(redis: Redis) {
    this.emailQueue = new Queue('email-sync', {
      connection: redis as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    this.calendarQueue = new Queue('calendar-sync', {
      connection: redis as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  }

  async start() {
    // Add repeating jobs for periodic sync
    // Email sync every 5 minutes for active users
    await this.emailQueue.add(
      'periodic-sync',
      { type: 'periodic' },
      {
        repeat: {
          every: 5 * 60 * 1000, // 5 minutes
        },
        jobId: 'email-periodic-sync',
      },
    );

    // Calendar sync every 15 minutes
    await this.calendarQueue.add(
      'periodic-sync',
      { type: 'periodic' },
      {
        repeat: {
          every: 15 * 60 * 1000, // 15 minutes
        },
        jobId: 'calendar-periodic-sync',
      },
    );

    console.log('Sync scheduler started');
  }

  async stop() {
    await this.emailQueue.close();
    await this.calendarQueue.close();
  }

  // Queue a sync job for a specific user
  async queueEmailSync(userId: string, tenantId: string, isInitialImport = false) {
    await this.emailQueue.add(
      'user-sync',
      { userId, tenantId, isInitialImport },
      {
        jobId: `email-${userId}-${Date.now()}`,
        priority: isInitialImport ? 10 : 1,
      },
    );
  }

  async queueCalendarSync(userId: string, tenantId: string) {
    await this.calendarQueue.add(
      'user-sync',
      { userId, tenantId },
      {
        jobId: `calendar-${userId}-${Date.now()}`,
      },
    );
  }

  // Queue initial import for a new user
  async queueInitialImport(userId: string, tenantId: string) {
    await this.queueEmailSync(userId, tenantId, true);
    await this.queueCalendarSync(userId, tenantId);
  }
}
