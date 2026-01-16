# Changelog

All notable changes to InviCRM.

---

## [17 January 2026] - Sync Worker Bug Fixes & Calendar Integration (Session 5)

### Accomplished
- Fixed tenant_id null constraint violation bug in email sync worker
- Fixed same bug in calendar sync worker
- Both workers now properly handle periodic sync jobs
- Added userId field to activities created from email and calendar sync
- Added validation to prevent null tenant_id in sync operations

### Fixed
- **Email Sync Worker:** Periodic sync jobs (type: 'periodic') were missing userId/tenantId, causing null constraint violations
- **Calendar Sync Worker:** Same issue with periodic sync jobs
- **Root Cause:** Scheduler queued `{ type: 'periodic' }` jobs but workers expected `userId` and `tenantId` in all jobs
- **Solution:** Added `processPeriodicSync()` method that iterates through all users with active Google integrations, getting tenantId from the user relation

### Technical Details
- Refactored both workers to use `processSingleUserSync()` for code reuse
- Added validation at start of `processJob()` to reject invalid job data
- Added validation in `processMessage()`/`processEvent()` to catch any edge cases
- Activities now include `userId` to track which user's sync created them
- Periodic sync now properly loads user relation to get `tenantId`

### Files Changed
- `apps/sync-service/src/workers/email-sync.worker.ts`
- `apps/sync-service/src/workers/calendar-sync.worker.ts`

### Next Steps
- Deploy to staging server with HTTPS for Slack testing
- Test Slack bot OAuth and /leancrm command
- Add Anthropic API key for AI entity extraction

---

## [17 January 2026] - Google OAuth & Gmail Sync Working (Session 4)

### Accomplished
- Configured Google Cloud OAuth credentials (project: invicrm-484520)
- Fixed Google OAuth strategy to properly request refresh tokens
- Successfully tested Google OAuth flow with Gmail/Calendar scopes
- Fixed TypeScript build errors in sync-service (Redis types, unused vars)
- Tested Gmail historical import - 1800+ emails synced from 90 days
- Verified contact auto-creation from emails (200+ contacts)
- Verified company auto-inference from email domains (150+ companies)

### Fixed
- Google Strategy: Added `authorizationParams()` method to properly pass `access_type=offline` and `prompt=consent` to Google OAuth
- Sync-service: Cast Redis connection to fix BullMQ type incompatibilities
- Sync-service: Removed deprecated `QueueScheduler` (not needed in newer BullMQ)
- Sync-service: Fixed DataSourceOptions type casting
- Sync-service: Fixed default port to 5433

### Technical Details
- OAuth tokens (access + refresh) now stored in `user_integrations` table
- Sync worker processes emails in batches of 100 with rate limiting
- Contacts auto-created with confidence score 0.6 from email senders
- Companies inferred from email domains (excludes gmail.com, yahoo.com, etc.)
- Activities stored with threadId for email thread association

### Blocked
- Slack bot testing requires HTTPS redirect URL (needs staging server)

### Known Issue
- Email sync hits error after ~2100 messages: `tenant_id` null constraint violation
- Root cause: Need to investigate `processMessage()` in email-sync.worker.ts

### Next Steps
- Fix tenant_id bug in email sync worker
- Deploy to staging server with HTTPS
- Test Slack bot OAuth and /leancrm command
- Test Calendar sync
- Add Anthropic API key for AI entity extraction

---

## [16 January 2026] - Seed Data & API Fixes (Session 3)

### Accomplished
- Created comprehensive seed data system for development
- Added GCC-focused sample data: 6 companies, 8 contacts, 5 deals, 8 activities, 5 tasks
- Fixed TypeORM query builder column naming issue in ContactsService
- Verified API endpoints work with seeded data

### Added
- `packages/database/src/seeds/seed-data.ts` - All seed data definitions
- `packages/database/src/seeds/run.ts` - Seed runner with --force option
- Added bcrypt dependency to database package for password hashing

### Seed Data Highlights
- Tenant: LEAN Services Demo
- Users: admin@lean-demo.com / password123 (admin), plus 2 sales reps
- Pipeline: 6-stage sales pipeline with LEAN brand colors
- Companies: NBK, Zain, Agility, Alghanim, KOC, Emaar
- Deals: KWD 455K open pipeline + AED 350K won deal
- GCC region focus: Kuwait-based contacts, KWD currency

### Fixed
- ContactsService query builder: Changed from database column names to TypeORM property names
- Build cache issue: Cleared tsconfig.tsbuildinfo to fix incremental build

### Verified Working
- Seed script: `npm run seed` (from packages/database)
- API authentication with seeded users
- Contacts endpoint returns seeded data
- Deals endpoint returns seeded data

### Next Steps
- Configure Google Cloud OAuth credentials
- Test Google OAuth flow
- Implement Gmail sync worker

---

## [16 January 2026] - Infrastructure & Auth Testing

### Accomplished
- Fixed Docker Compose port conflict (changed PostgreSQL to 5433)
- Generated and ran first TypeORM migration (12 tables created)
- Fixed TypeScript strict mode issues for entities and DTOs
- Made Google OAuth strategy conditional (API starts without credentials)
- Successfully tested user registration and JWT authentication
- Created comprehensive setup documentation (technical/SETUP.md)

### Technical Fixes
- Updated database port defaults to 5433 across all config files
- Disabled `strictPropertyInitialization` for TypeORM entities and NestJS DTOs
- Added conditional provider pattern for GoogleStrategy

### Verified Working
- PostgreSQL connection and migrations
- User registration with auto-tenant creation
- JWT login and token generation
- Health check endpoint

### Added
- `technical/SETUP.md` - Complete setup guide with external services instructions
- `packages/database/src/migrations/1768592956964-InitialSchema.ts` - Database schema

### Next Steps
- Configure Google Cloud OAuth credentials
- Create Slack app
- Test Gmail sync flow
- Create development seed data

---

## [16 January 2026] - Project Initialization

### Accomplished
- Created monorepo structure with Turborepo
- Built NestJS API with modules: auth, users, tenants, contacts, deals, activities
- Created database package with 12 TypeORM entities
- Built sync-service with Gmail and Calendar workers (BullMQ)
- Built multi-tenant Slack bot with OAuth installation flow
- Created ai-client package with entity extraction, NL parsing, sentiment analysis
- Set up Docker Compose (PostgreSQL, Redis, pgAdmin, Redis Commander)

### Decisions
- **Multi-tenant Slack:** Single Slack app with OAuth per workspace (not per-tenant apps)
- **Currency default:** KWD with support for GCC currencies
- **AI model:** Claude 3.5 Sonnet for entity extraction
- **Job queue:** BullMQ for background sync jobs

### Added
- `apps/api/` - Full NestJS API structure
- `apps/sync-service/` - Email and calendar sync workers
- `apps/slack-bot/` - Slack bot with commands, events, messages
- `packages/database/` - 12 entities (tenant, user, contact, deal, etc.)
- `packages/shared/` - Types, constants, utilities
- `packages/ai-client/` - Claude API wrapper
- `infrastructure/docker/` - Docker Compose config
- `.env.example` - Environment template
- `CLAUDE.md` - Project context file
- `PROJECT-TODO.md` - Task tracker with all phases
- `.claude/commands/` - Session management commands
- `technical/` - Architecture, API, deployment, testing docs

### Next Steps
- Set up Google Cloud Console OAuth credentials
- Create Slack app at api.slack.com
- Get Anthropic API key
- Run first database migration
- Test user registration flow

---

## Template

## [YYYY-MM-DD] - Session Title

### Accomplished
- What was done

### Decisions
- Key decisions made

### Added/Changed
- Files modified

### Next Steps
- Priorities for next session
