import 'reflect-metadata';
import { config } from 'dotenv';
import { App, LogLevel, Installation } from '@slack/bolt';
import { DataSource } from 'typeorm';
import { dataSource } from '@invicrm/database';
import { SlackInstallationStore } from './stores/installation-store';
import { registerCommands } from './commands';
import { registerEventHandlers } from './events';
import { registerMessageHandlers } from './messages';

config();

async function bootstrap() {
  console.log('Starting InviCRM Slack Bot...');

  // Initialize database connection
  const db = new DataSource({
    ...dataSource.options,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'invicrm',
    password: process.env.DATABASE_PASSWORD || 'invicrm_dev',
    database: process.env.DATABASE_NAME || 'invicrm',
  });

  await db.initialize();
  console.log('Database connected');

  // Create installation store for multi-tenant OAuth
  const installationStore = new SlackInstallationStore(db);

  // Initialize Slack Bolt app with OAuth
  const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    clientId: process.env.SLACK_CLIENT_ID!,
    clientSecret: process.env.SLACK_CLIENT_SECRET!,
    stateSecret: process.env.SLACK_STATE_SECRET || 'invicrm-slack-state-secret',
    scopes: [
      'app_mentions:read',
      'channels:history',
      'chat:write',
      'commands',
      'im:history',
      'im:read',
      'im:write',
      'users:read',
      'users:read.email',
    ],
    installationStore: {
      storeInstallation: async (installation: Installation) => {
        await installationStore.store(installation);
      },
      fetchInstallation: async (installQuery) => {
        return installationStore.fetch(installQuery);
      },
      deleteInstallation: async (installQuery) => {
        await installationStore.delete(installQuery);
      },
    },
    installerOptions: {
      directInstall: true,
      stateVerification: true,
    },
    logLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  });

  // Register handlers
  registerCommands(app, db);
  registerEventHandlers(app, db);
  registerMessageHandlers(app, db);

  // Start the app
  const port = parseInt(process.env.SLACK_BOT_PORT || '3002', 10);
  await app.start(port);

  console.log(`InviCRM Slack Bot is running on port ${port}`);
  console.log(`OAuth Install URL: http://localhost:${port}/slack/install`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    await app.stop();
    await db.destroy();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start Slack bot:', err);
  process.exit(1);
});
