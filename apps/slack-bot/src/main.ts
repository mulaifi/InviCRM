import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';
import { App, LogLevel, Installation } from '@slack/bolt';
import { DataSource } from 'typeorm';
import { dataSource } from '@invicrm/database';
import { SlackInstallationStore } from './stores/installation-store';
import { registerCommands } from './commands';
import { registerEventHandlers } from './events';
import { registerMessageHandlers } from './messages';

// Load environment variables (prefer .env.local over .env)
// Try multiple paths to handle different working directories
const envPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '../../.env.local'),
  resolve(__dirname, '../../../.env.local'),
];
for (const envPath of envPaths) {
  config({ path: envPath });
}

async function bootstrap() {
  console.log('Starting InviCRM Slack Bot...');

  // Determine if we're using Socket Mode (for local dev) or HTTP mode (for production)
  const useSocketMode = !!process.env.SLACK_APP_TOKEN;
  console.log(`Mode: ${useSocketMode ? 'Socket Mode (local dev)' : 'HTTP Mode (requires public URL)'}`);

  // Initialize database connection
  const db = new DataSource({
    ...dataSource.options,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5433', 10),
    username: process.env.DATABASE_USER || 'invicrm',
    password: process.env.DATABASE_PASSWORD || 'invicrm_dev',
    database: process.env.DATABASE_NAME || 'invicrm',
  } as typeof dataSource.options);

  await db.initialize();
  console.log('Database connected');

  // Create installation store for multi-tenant OAuth
  const installationStore = new SlackInstallationStore(db);

  // Base app configuration
  const baseConfig = {
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    logLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  };

  // Initialize Slack Bolt app
  // Socket Mode: Uses WebSocket connection, no public URL needed (for local development)
  // HTTP Mode: Requires public URL for OAuth callbacks (for production)
  const app = useSocketMode
    ? new App({
        ...baseConfig,
        socketMode: true,
        appToken: process.env.SLACK_APP_TOKEN!,
        token: process.env.SLACK_BOT_TOKEN, // Optional: pre-installed bot token for single workspace
      })
    : new App({
        ...baseConfig,
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
      });

  // Register handlers
  registerCommands(app, db);
  registerEventHandlers(app, db);
  registerMessageHandlers(app, db);

  // Start the app
  if (useSocketMode) {
    await app.start();
    console.log('InviCRM Slack Bot is running in Socket Mode');
    console.log('WebSocket connection established - no public URL required');
  } else {
    const port = parseInt(process.env.SLACK_BOT_PORT || '3002', 10);
    await app.start(port);
    console.log(`InviCRM Slack Bot is running on port ${port}`);
    console.log(`OAuth Install URL: http://localhost:${port}/slack/install`);
  }

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
