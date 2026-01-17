# InviCRM Setup Guide

This guide covers setting up the development environment and external services for InviCRM.

## Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose
- Git

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Infrastructure

```bash
npm run docker:up
```

This starts:
- PostgreSQL on port 5433
- Redis on port 6379
- pgAdmin on port 5050 (admin@invicrm.local / admin)
- Redis Commander on port 8081

### 3. Run Database Migration

```bash
npm run build -w @invicrm/database
npm run db:migrate
```

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials (see External Services section below).

### 5. Start the API

```bash
cd apps/api
rm -rf dist tsconfig.tsbuildinfo
npx tsc -p tsconfig.json --outDir ./dist
NODE_ENV=development node dist/main.js
```

The API will be available at:
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api/docs

## External Services Setup

### Google Cloud (Gmail & Calendar)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project named "InviCRM"
3. Enable APIs:
   - Gmail API
   - Google Calendar API
4. Configure OAuth consent screen:
   - User Type: External (or Internal for Workspace)
   - App name: InviCRM
   - Scopes: `email`, `profile`, `gmail.readonly`, `calendar.readonly`
5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/v1/auth/google/callback`
6. Copy Client ID and Client Secret to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### Slack App (Socket Mode for Local Development)

Socket Mode allows testing the Slack bot locally without a public URL or HTTPS.

1. Go to [Slack API](https://api.slack.com/apps)
2. Create New App > From scratch
   - App Name: InviCRM
   - Select your workspace

3. **Enable Socket Mode** (Settings > Socket Mode):
   - Toggle "Enable Socket Mode" ON
   - Generate App-Level Token:
     - Token Name: `socket-token`
     - Scope: `connections:write`
   - Copy the token (starts with `xapp-`)

4. **Configure Bot Token Scopes** (Features > OAuth & Permissions):
   - `chat:write`
   - `commands`
   - `im:history`
   - `im:read`
   - `im:write`
   - `users:read`
   - `users:read.email`

5. **Create Slash Command** (Features > Slash Commands):
   - Command: `/leancrm`
   - Short Description: "InviCRM commands"
   - Usage Hint: `[contact|deal|log|brief]`
   - (No Request URL needed in Socket Mode)

6. **Enable Events** (Features > Event Subscriptions):
   - Toggle ON (no URL needed in Socket Mode)
   - Subscribe to bot events:
     - `message.im` (Direct messages)
     - `app_mention` (When mentioned)

7. **Install App to Workspace**:
   - Go to OAuth & Permissions
   - Click "Install to Workspace"
   - Copy the Bot User OAuth Token (starts with `xoxb-`)

8. **Add credentials to `.env.local`**:
   ```
   # Socket Mode tokens (for local development)
   SLACK_APP_TOKEN=xapp-1-...
   SLACK_BOT_TOKEN=xoxb-...
   ```

9. **Start the Slack bot**:
   ```bash
   cd apps/slack-bot
   npm run dev
   ```

10. **Test**: Open Slack, DM the bot or use `/leancrm help`

**Note**: For production deployment with HTTP mode, you'll also need:
```
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
SLACK_SIGNING_SECRET=your-signing-secret
```

### AI Configuration (Ollama or Anthropic)

InviCRM supports multiple AI providers for NL parsing and briefing generation.

#### Option 1: Ollama (Local LLM - Recommended for Development)

1. Install Ollama: https://ollama.ai
2. Pull the recommended model:
   ```bash
   ollama pull qwen2.5:7b
   ```
3. Configure `.env.local`:
   ```
   AI_PROVIDER=ollama
   AI_MODEL=qwen2.5:7b
   AI_BASE_URL=http://localhost:11434/v1
   ```

#### Option 2: Anthropic (Cloud API)

1. Go to [Anthropic Console](https://console.anthropic.com)
2. Create an API key
3. Configure `.env.local`:
   ```
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-...
   ```

#### Recommended Models

| Provider | Model | RAM | Best For |
|----------|-------|-----|----------|
| Ollama | qwen2.5:7b | ~5GB | Development, JSON output |
| Ollama | qwen2.5:14b | ~12GB | Better quality |
| Anthropic | claude-3-5-sonnet | Cloud | Production |

## Database Connection

Default credentials (for development):
- Host: localhost
- Port: 5433
- Database: invicrm
- Username: invicrm
- Password: invicrm_dev

Access pgAdmin at http://localhost:5050 to inspect the database.

## Testing the API

### Health Check
```bash
curl http://localhost:3000/api/v1/health
```

### Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"SecurePass123","firstName":"John","lastName":"Doe","companyName":"Acme Inc"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"SecurePass123"}'
```

## Troubleshooting

### Port 5432 Already in Use
The default PostgreSQL port is changed to 5433 to avoid conflicts with existing PostgreSQL installations.

### TypeScript Build Issues
If builds fail, try clearing the build cache:
```bash
rm -rf dist tsconfig.tsbuildinfo
```

### Google OAuth Not Working
The Google Strategy is optional. If not configured, the API will start with a warning but basic auth (email/password) will still work.

## Next Steps

After setup, you can:
1. Configure Google OAuth for Gmail/Calendar sync
2. Create a Slack app and install it to your workspace
3. Start building integrations

Refer to `technical/architecture.md` for system design details.
