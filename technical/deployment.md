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

## Production Deployment (Docker)

InviCRM uses a multi-stage Dockerfile and Docker Compose for production deployment with automatic HTTPS via Traefik and Let's Encrypt.

### Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │              Traefik                     │
                    │    (HTTPS termination, routing)          │
                    │    Port 80 → 443 redirect                │
                    └─────────────┬───────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   API Server   │      │  Slack Bot    │      │  Sync Service │
│  api.domain    │      │ slack.domain  │      │  (internal)   │
│   Port 3000    │      │  Port 3002    │      │  No exposure  │
└───────┬───────┘      └───────┬───────┘      └───────┬───────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              ▼                                 ▼
      ┌───────────────┐               ┌───────────────┐
      │  PostgreSQL   │               │    Redis      │
      │   (internal)  │               │  (internal)   │
      └───────────────┘               └───────────────┘
```

### Prerequisites

- Linux server (Ubuntu 22.04+ recommended)
- Docker Engine 24+
- Docker Compose V2
- Domain with DNS configured:
  - `api.yourdomain.com` → server IP
  - `slack.yourdomain.com` → server IP
- Ports 80 and 443 open

### Deployment Steps

#### 1. Clone Repository on Server

```bash
git clone https://github.com/your-org/InviCRM.git
cd InviCRM
```

#### 2. Configure Environment

```bash
cd infrastructure/docker
cp .env.prod.example .env.prod
nano .env.prod  # Edit with production values
```

Key variables to configure:

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Your base domain (e.g., `invicrm.lean-serv.com`) |
| `ACME_EMAIL` | Email for Let's Encrypt certificates |
| `DB_PASSWORD` | Strong PostgreSQL password |
| `REDIS_PASSWORD` | Strong Redis password |
| `JWT_SECRET` | 32+ character random string |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `SLACK_CLIENT_ID` | From Slack API |
| `SLACK_CLIENT_SECRET` | From Slack API |
| `SLACK_SIGNING_SECRET` | From Slack API |
| `ANTHROPIC_API_KEY` | From Anthropic Console |

Generate secure passwords:
```bash
openssl rand -base64 32  # For DB_PASSWORD, REDIS_PASSWORD
openssl rand -base64 48  # For JWT_SECRET
```

#### 3. Build and Deploy

```bash
# Build all images
docker compose -f docker-compose.prod.yml build

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

#### 4. Run Database Migrations

```bash
# Connect to API container and run migrations
docker compose -f docker-compose.prod.yml exec api \
  npx typeorm migration:run -d apps/api/dist/data-source.js
```

Or run migrations before starting:
```bash
# Start only database first
docker compose -f docker-compose.prod.yml up -d postgres

# Run migrations from local machine
DATABASE_HOST=your-server-ip npm run db:migrate

# Then start all services
docker compose -f docker-compose.prod.yml up -d
```

#### 5. Update External Service Callbacks

After deployment, update OAuth callback URLs:

**Google Cloud Console:**
- Authorized redirect URI: `https://api.yourdomain.com/auth/google/callback`

**Slack App:**
- OAuth Redirect URL: `https://slack.yourdomain.com/slack/oauth_redirect`
- Event Request URL: `https://slack.yourdomain.com/slack/events`
- Slash Command URL: `https://slack.yourdomain.com/slack/events`

### Management Commands

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f slack-bot

# Restart a service
docker compose -f docker-compose.prod.yml restart api

# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: deletes data)
docker compose -f docker-compose.prod.yml down -v

# Rebuild and redeploy
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Health Checks

Services expose health endpoints:

| Service | Health URL |
|---------|------------|
| API | `https://api.yourdomain.com/health` |
| Slack Bot | `https://slack.yourdomain.com/health` |

Docker Compose includes built-in health checks. View status:
```bash
docker compose -f docker-compose.prod.yml ps
```

### Backup and Restore

**Backup PostgreSQL:**
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U invicrm invicrm > backup_$(date +%Y%m%d).sql
```

**Restore PostgreSQL:**
```bash
cat backup_20260117.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U invicrm invicrm
```

### SSL Certificates

Traefik automatically obtains and renews Let's Encrypt certificates. Certificates are stored in the `traefik_letsencrypt` volume.

To verify certificates:
```bash
curl -I https://api.yourdomain.com
# Should show HTTP/2 200 with valid certificate
```

### Scaling (Optional)

For high availability, you can scale the API:
```bash
docker compose -f docker-compose.prod.yml up -d --scale api=3
```

Note: This requires additional load balancer configuration in Traefik.

### Troubleshooting

**Container won't start:**
```bash
docker compose -f docker-compose.prod.yml logs api
```

**Database connection issues:**
```bash
docker compose -f docker-compose.prod.yml exec api \
  node -e "require('pg').Pool({host:'postgres'}).query('SELECT 1').then(console.log)"
```

**SSL certificate issues:**
```bash
docker compose -f docker-compose.prod.yml logs traefik
# Check ACME_EMAIL is valid and domain DNS is correct
```

### Environment Variables Reference

See `infrastructure/docker/.env.prod.example` for all available variables.

### Build Without Docker Compose

If deploying to managed services (e.g., Google Cloud Run, AWS ECS):

```bash
# Build specific target
docker build --target api -t invicrm-api:latest .
docker build --target sync-service -t invicrm-sync:latest .
docker build --target slack-bot -t invicrm-slack:latest .

# Push to registry
docker tag invicrm-api:latest gcr.io/your-project/invicrm-api:latest
docker push gcr.io/your-project/invicrm-api:latest
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
*Last Updated: 17 January 2026*
