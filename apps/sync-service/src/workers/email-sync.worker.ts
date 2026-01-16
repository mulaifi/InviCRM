import { Worker, Job } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { google } from 'googleapis';
import {
  User,
  UserIntegration,
  Contact,
  Company,
  Activity,
  EmailSyncState,
} from '@invicrm/database';
import { AIClient, EntityExtractor } from '@invicrm/ai-client';

export interface EmailSyncJob {
  userId?: string;
  tenantId?: string;
  isInitialImport?: boolean;
  type?: 'periodic'; // For scheduled periodic sync jobs
}

export class EmailSyncWorker {
  private worker: Worker<EmailSyncJob> | null = null;
  private userRepo: Repository<User>;
  private integrationRepo: Repository<UserIntegration>;
  private contactRepo: Repository<Contact>;
  private companyRepo: Repository<Company>;
  private activityRepo: Repository<Activity>;
  private syncStateRepo: Repository<EmailSyncState>;
  private entityExtractor: EntityExtractor | null = null;

  constructor(
    db: DataSource,
    private redis: Redis,
  ) {
    this.userRepo = db.getRepository(User);
    this.integrationRepo = db.getRepository(UserIntegration);
    this.contactRepo = db.getRepository(Contact);
    this.companyRepo = db.getRepository(Company);
    this.activityRepo = db.getRepository(Activity);
    this.syncStateRepo = db.getRepository(EmailSyncState);

    // Initialize AI client if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      const aiClient = new AIClient({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      this.entityExtractor = new EntityExtractor(aiClient);
    }
  }

  start() {
    this.worker = new Worker<EmailSyncJob>(
      'email-sync',
      async (job: Job<EmailSyncJob>) => {
        console.log(`Processing email sync job for user ${job.data.userId}`);
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
      console.log(`Email sync job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Email sync job ${job?.id} failed:`, err);
    });
  }

  async stop() {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async processJob(data: EmailSyncJob) {
    // Handle periodic sync - process all users with active integrations
    if (data.type === 'periodic') {
      await this.processPeriodicSync();
      return;
    }

    const { userId, tenantId, isInitialImport } = data;

    // Validate required fields for user-specific sync
    if (!userId || !tenantId) {
      console.error('Invalid job data: missing userId or tenantId', data);
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

    await this.processSingleUserSync(userId, tenantId, integration, isInitialImport || false);
  }

  private async processPeriodicSync() {
    // Get all active Google integrations
    const integrations = await this.integrationRepo.find({
      where: { provider: 'google', isActive: true },
      relations: ['user'],
    });

    console.log(`Processing periodic sync for ${integrations.length} users`);

    for (const integration of integrations) {
      if (!integration.user?.tenantId) {
        console.warn(`Skipping integration ${integration.id}: missing user or tenantId`);
        continue;
      }

      try {
        await this.processSingleUserSync(
          integration.userId,
          integration.user.tenantId,
          integration,
          false, // not initial import
        );
      } catch (error) {
        console.error(`Periodic sync failed for user ${integration.userId}:`, error);
        // Continue with other users
      }
    }
  }

  private async processSingleUserSync(
    userId: string,
    tenantId: string,
    integration: UserIntegration,
    isInitialImport: boolean,
  ) {
    // Initialize Gmail client
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

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get or create sync state
    let syncState = await this.syncStateRepo.findOne({ where: { userId } });
    if (!syncState) {
      syncState = this.syncStateRepo.create({
        userId,
        syncStatus: 'syncing',
      });
    } else {
      syncState.syncStatus = 'syncing';
    }
    await this.syncStateRepo.save(syncState);

    try {
      if (isInitialImport && !syncState.initialImportCompleted) {
        await this.performInitialImport(gmail, tenantId, userId, syncState);
      } else {
        await this.performIncrementalSync(gmail, tenantId, userId, syncState);
      }

      syncState.syncStatus = 'completed';
      syncState.lastSyncAt = new Date();
      syncState.errorCount = 0;
      syncState.errorMessage = undefined as any;
    } catch (error: any) {
      console.error(`Email sync failed for user ${userId}:`, error);
      syncState.syncStatus = 'error';
      syncState.errorCount += 1;
      syncState.errorMessage = error.message;
      syncState.lastErrorAt = new Date();
    }

    await this.syncStateRepo.save(syncState);
  }

  private async performInitialImport(
    gmail: any,
    tenantId: string,
    userId: string,
    syncState: EmailSyncState,
  ) {
    // Get messages from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const query = `after:${Math.floor(ninetyDaysAgo.getTime() / 1000)}`;

    let pageToken: string | undefined;
    let totalProcessed = 0;

    do {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 100,
        pageToken,
      });

      const messages = response.data.messages || [];

      for (const msg of messages) {
        await this.processMessage(gmail, tenantId, userId, msg.id);
        totalProcessed++;
      }

      pageToken = response.data.nextPageToken;
      syncState.messagesSynced = totalProcessed;
      await this.syncStateRepo.save(syncState);

      // Rate limiting
      await this.sleep(100);
    } while (pageToken);

    syncState.initialImportCompleted = true;

    // Get current history ID for incremental sync
    const profile = await gmail.users.getProfile({ userId: 'me' });
    syncState.historyId = profile.data.historyId;
  }

  private async performIncrementalSync(
    gmail: any,
    tenantId: string,
    userId: string,
    syncState: EmailSyncState,
  ) {
    if (!syncState.historyId) {
      // Fall back to initial import if no history ID
      await this.performInitialImport(gmail, tenantId, userId, syncState);
      return;
    }

    try {
      const response = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: syncState.historyId,
        historyTypes: ['messageAdded'],
      });

      const history = response.data.history || [];

      for (const record of history) {
        const messagesAdded = record.messagesAdded || [];
        for (const msg of messagesAdded) {
          await this.processMessage(gmail, tenantId, userId, msg.message.id);
        }
      }

      // Update history ID
      if (response.data.historyId) {
        syncState.historyId = response.data.historyId;
      }
    } catch (error: any) {
      if (error.code === 404) {
        // History expired, perform full sync
        console.log(`History expired for user ${userId}, performing full sync`);
        syncState.initialImportCompleted = false;
        await this.performInitialImport(gmail, tenantId, userId, syncState);
      } else {
        throw error;
      }
    }
  }

  private async processMessage(
    gmail: any,
    tenantId: string,
    userId: string,
    messageId: string,
  ) {
    // Validate tenantId to prevent null constraint violations
    if (!tenantId) {
      console.error(`Cannot process message ${messageId}: tenantId is missing`);
      return;
    }

    // Check if already processed
    const existing = await this.activityRepo.findOne({
      where: { externalId: messageId, tenantId },
    });
    if (existing) return;

    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const headers = msg.data.payload.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

    const from = getHeader('From') || '';
    const to = getHeader('To') || '';
    const subject = getHeader('Subject') || '(no subject)';
    const date = new Date(parseInt(msg.data.internalDate));

    // Determine direction
    const userEmail = await this.getUserEmail(userId);
    const direction = from.includes(userEmail) ? 'outbound' : 'inbound';

    // Extract email address from "Name <email@example.com>" format
    const emailMatch = (direction === 'inbound' ? from : to).match(/<([^>]+)>/);
    const contactEmail = emailMatch ? emailMatch[1] : (direction === 'inbound' ? from : to);

    // Find or create contact
    const contact = await this.findOrCreateContact(tenantId, contactEmail, from);

    // Get email body
    const body = this.extractBody(msg.data.payload);

    // Create activity
    const activity = this.activityRepo.create({
      tenantId,
      userId,
      type: 'email',
      direction,
      subject,
      body: body.substring(0, 10000), // Limit body size
      contactId: contact?.id,
      externalId: messageId,
      threadId: msg.data.threadId,
      occurredAt: date,
      source: 'gmail_sync',
      metadata: {
        labelIds: msg.data.labelIds,
      },
    });

    await this.activityRepo.save(activity);

    // Update contact's last contacted date
    if (contact) {
      contact.lastContactedAt = date;
      await this.contactRepo.save(contact);
    }

    // Extract entities using AI (if available)
    if (this.entityExtractor && body.length > 50) {
      try {
        const entities = await this.entityExtractor.extractFromEmail(subject, body);
        // Store extracted data in activity metadata
        activity.metadata = {
          ...activity.metadata,
          extractedEntities: entities,
        };
        await this.activityRepo.save(activity);
      } catch (err) {
        console.error('Entity extraction failed:', err);
      }
    }
  }

  private extractBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
      // Try HTML if no plain text
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
          return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        // Recurse into multipart
        if (part.parts) {
          const nested = this.extractBody(part);
          if (nested) return nested;
        }
      }
    }

    return '';
  }

  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return user?.email || '';
  }

  private async findOrCreateContact(
    tenantId: string,
    email: string,
    fromHeader: string,
  ): Promise<Contact | null> {
    if (!email) return null;

    // Skip common no-reply addresses
    if (email.includes('noreply') || email.includes('no-reply') || email.includes('mailer-daemon')) {
      return null;
    }

    let contact = await this.contactRepo.findOne({
      where: { email, tenantId, isDeleted: false },
    });

    if (!contact) {
      // Extract name from "Name <email>" format
      const nameMatch = fromHeader.match(/^([^<]+)</);
      const name = nameMatch ? nameMatch[1].trim() : email.split('@')[0];
      const nameParts = name.split(' ');

      // Auto-create company from domain
      const domain = email.split('@')[1];
      let companyId: string | undefined;
      if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
        const company = await this.findOrCreateCompany(tenantId, domain);
        companyId = company?.id;
      }

      contact = this.contactRepo.create({
        tenantId,
        email,
        firstName: nameParts[0] || email.split('@')[0],
        lastName: nameParts.slice(1).join(' ') || undefined,
        companyId,
        source: 'email_sync',
        confidenceScore: 0.6,
      });
      contact = await this.contactRepo.save(contact);
    }

    return contact;
  }

  private async findOrCreateCompany(tenantId: string, domain: string): Promise<Company | null> {
    let company = await this.companyRepo.findOne({
      where: { domain, tenantId, isDeleted: false },
    });

    if (!company) {
      const name = domain.split('.')[0];
      company = this.companyRepo.create({
        tenantId,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        domain,
        source: 'auto_inferred',
      });
      company = await this.companyRepo.save(company);
    }

    return company;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
