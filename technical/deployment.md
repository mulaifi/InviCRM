# InviCRM Deployment Guide

## Local Development

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm 10+

### Setup
```bash
# Clone and install
cd /Users/mulaifi/Documents/Code/projects/business-apps/InviCRM
npm install

# Start infrastructure
npm run docker:up

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run migrations
npm run db:migrate

# Start development servers
npm run dev
```

### Services
| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| API Docs | http://localhost:3000/api/docs |
| Slack Bot | http://localhost:3002 |
| pgAdmin | http://localhost:5050 |
| Redis Commander | http://localhost:8081 |

### Docker Services
```bash
npm run docker:up    # Start PostgreSQL, Redis
npm run docker:down  # Stop services
npm run docker:logs  # View logs
```

## Production Deployment

### Environment Variables
Required for production:
```
NODE_ENV=production
DATABASE_HOST=<production-db-host>
DATABASE_SSL=true
JWT_SECRET=<secure-random-string>
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
SLACK_CLIENT_ID=<from-slack-api>
SLACK_CLIENT_SECRET=<from-slack-api>
SLACK_SIGNING_SECRET=<from-slack-api>
ANTHROPIC_API_KEY=<from-anthropic>
```

### Build
```bash
npm run build  # Builds all apps and packages
```

### Database Migrations
```bash
npm run db:migrate  # Run pending migrations
```

## External Service Setup

### Google Cloud Console
1. Go to console.cloud.google.com
2. Create new project "InviCRM"
3. Enable APIs:
   - Gmail API
   - Google Calendar API
4. Configure OAuth consent screen:
   - User type: External
   - Scopes: gmail.readonly, calendar.readonly
5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URI: `{API_URL}/api/v1/auth/google/callback`

### Slack App
1. Go to api.slack.com/apps
2. Create new app "InviCRM"
3. Enable OAuth & Permissions:
   - Redirect URL: `{SLACK_BOT_URL}/slack/oauth_redirect`
   - Bot Token Scopes: app_mentions:read, chat:write, commands, im:history, im:read, im:write, users:read, users:read.email
4. Enable Event Subscriptions:
   - Request URL: `{SLACK_BOT_URL}/slack/events`
   - Subscribe to: app_home_opened, app_mention, message.im
5. Create Slash Command:
   - Command: /leancrm
   - Request URL: `{SLACK_BOT_URL}/slack/events`

### Anthropic
1. Go to console.anthropic.com
2. Create API key
3. Add to environment as ANTHROPIC_API_KEY

---
*Last Updated: 16 January 2026*
