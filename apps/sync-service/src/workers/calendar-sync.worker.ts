import { Worker, Job } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { google } from 'googleapis';
import { User, UserIntegration, Contact, Activity } from '@invicrm/database';

export interface CalendarSyncJob {
  userId?: string;
  tenantId?: string;
  type?: 'periodic'; // For scheduled periodic sync jobs
}

export class CalendarSyncWorker {
  private worker: Worker<CalendarSyncJob> | null = null;
  private userRepo: Repository<User>;
  private integrationRepo: Repository<UserIntegration>;
  private contactRepo: Repository<Contact>;
  private activityRepo: Repository<Activity>;

  constructor(
    db: DataSource,
    private redis: Redis,
  ) {
    this.userRepo = db.getRepository(User);
    this.integrationRepo = db.getRepository(UserIntegration);
    this.contactRepo = db.getRepository(Contact);
    this.activityRepo = db.getRepository(Activity);
  }

  start() {
    this.worker = new Worker<CalendarSyncJob>(
      'calendar-sync',
      async (job: Job<CalendarSyncJob>) => {
        console.log(`Processing calendar sync job for user ${job.data.userId}`);
        await this.processJob(job.data);
      },
      {
        connection: this.redis as any,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      },
    );

    this.worker.on('completed', (job) => {
      console.log(`Calendar sync job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Calendar sync job ${job?.id} failed:`, err);
    });
  }

  async stop() {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async processJob(data: CalendarSyncJob) {
    // Handle periodic sync - process all users with active integrations
    if (data.type === 'periodic') {
      await this.processPeriodicSync();
      return;
    }

    const { userId, tenantId } = data;

    // Validate required fields for user-specific sync
    if (!userId || !tenantId) {
      console.error('Invalid calendar job data: missing userId or tenantId', data);
      return;
    }

    // Get user's Google integration
    const integration = await this.integrationRepo.findOne({
      where: { userId, provider: 'google', isActive: true },
    });

    if (!integration) {
      console.log(`No active Google integration for user ${userId}`);
      return;
    }

    await this.processSingleUserSync(userId, tenantId, integration);
  }

  private async processPeriodicSync() {
    // Get all active Google integrations
    const integrations = await this.integrationRepo.find({
      where: { provider: 'google', isActive: true },
      relations: ['user'],
    });

    console.log(`Processing periodic calendar sync for ${integrations.length} users`);

    for (const integration of integrations) {
      if (!integration.user?.tenantId) {
        console.warn(`Skipping calendar sync for integration ${integration.id}: missing user or tenantId`);
        continue;
      }

      try {
        await this.processSingleUserSync(
          integration.userId,
          integration.user.tenantId,
          integration,
        );
      } catch (error) {
        console.error(`Periodic calendar sync failed for user ${integration.userId}:`, error);
        // Continue with other users
      }
    }
  }

  private async processSingleUserSync(
    userId: string,
    tenantId: string,
    integration: UserIntegration,
  ) {
    // Initialize Calendar client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    // Refresh token if needed
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        integration.accessToken = tokens.access_token;
        integration.tokenExpiresAt = new Date(Date.now() + 3600 * 1000);
        await this.integrationRepo.save(integration);
      }
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Sync events from last 30 days and next 30 days
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);

    let pageToken: string | undefined;

    do {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
        pageToken,
      });

      const events = response.data.items || [];

      for (const event of events) {
        await this.processEvent(event, tenantId, userId);
      }

      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);
  }

  private async processEvent(event: any, tenantId: string, userId: string) {
    // Validate tenantId to prevent null constraint violations
    if (!tenantId) {
      console.error(`Cannot process calendar event ${event.id}: tenantId is missing`);
      return;
    }

    // Skip all-day events and internal meetings (no external attendees)
    if (!event.start?.dateTime) return;

    const externalId = event.id;

    // Check if already processed
    const existing = await this.activityRepo.findOne({
      where: { externalId, tenantId },
    });

    if (existing) {
      // Update if changed
      if (existing.subject !== event.summary) {
        existing.subject = event.summary || '(no title)';
        await this.activityRepo.save(existing);
      }
      return;
    }

    // Get external attendees
    const attendees = event.attendees || [];
    const userEmail = await this.getUserEmail(userId);
    const externalAttendees = attendees.filter(
      (a: any) =>
        a.email !== userEmail &&
        !a.email?.includes('calendar.google.com') &&
        !a.self,
    );

    if (externalAttendees.length === 0) {
      // Internal meeting, skip
      return;
    }

    // Find or create contact for primary external attendee
    const primaryAttendee = externalAttendees[0];
    const contact = await this.findOrCreateContact(
      tenantId,
      primaryAttendee.email,
      primaryAttendee.displayName,
    );

    // Calculate duration
    const startTime = new Date(event.start.dateTime);
    const endTime = new Date(event.end.dateTime);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    // Create activity
    const activity = this.activityRepo.create({
      tenantId,
      userId,
      type: 'meeting',
      subject: event.summary || '(no title)',
      body: event.description || undefined,
      contactId: contact?.id,
      occurredAt: startTime,
      durationMinutes,
      externalId,
      source: 'calendar_sync',
      metadata: {
        location: event.location,
        conferenceData: event.conferenceData,
        attendees: externalAttendees.map((a: any) => ({
          email: a.email,
          displayName: a.displayName,
          responseStatus: a.responseStatus,
        })),
        status: event.status,
      },
    });

    await this.activityRepo.save(activity);

    // Update contact's last contacted date for past meetings
    if (contact && startTime < new Date()) {
      if (!contact.lastContactedAt || contact.lastContactedAt < startTime) {
        contact.lastContactedAt = startTime;
        await this.contactRepo.save(contact);
      }
    }
  }

  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return user?.email || '';
  }

  private async findOrCreateContact(
    tenantId: string,
    email: string,
    displayName?: string,
  ): Promise<Contact | null> {
    if (!email) return null;

    let contact = await this.contactRepo.findOne({
      where: { email, tenantId, isDeleted: false },
    });

    if (!contact) {
      const name = displayName || email.split('@')[0];
      const nameParts = name.split(' ');

      contact = this.contactRepo.create({
        tenantId,
        email,
        firstName: nameParts[0] || email.split('@')[0],
        lastName: nameParts.slice(1).join(' ') || undefined,
        source: 'calendar_sync',
        confidenceScore: 0.7,
      });
      contact = await this.contactRepo.save(contact);
    }

    return contact;
  }
}
