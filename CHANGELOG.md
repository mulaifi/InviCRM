# Changelog

All notable changes to InviCRM.

---

## [17 January 2026] - Frontend MVP Implementation (Session 16)

### Accomplished
- Implemented complete React + Vite frontend as `apps/web` in the Turborepo monorepo
- Built full MVP: Auth, Onboarding, Dashboard, Contacts, Deals Kanban, Activities, Settings
- Configured Tailwind CSS v4 with LEAN brand colors using `@theme` directive
- Created 15 shadcn/ui components with LEAN brand styling
- Implemented drag-and-drop Kanban board for deals using @dnd-kit
- Built AI-powered Dashboard with stats, briefing, activities, and tasks widgets

### Tech Stack
- React 19 + Vite 5 + TypeScript 5.7
- Tailwind CSS v4 with `@tailwindcss/vite` plugin (CSS-based config)
- React Router v7 (unified `react-router` package)
- TanStack Query v5 for server state
- Zustand v5 for client state (auth, UI)
- @dnd-kit for drag-and-drop Kanban

### Added Files (60+ files)
- `apps/web/` - Complete frontend application structure
- `apps/web/src/api/` - API clients (auth, contacts, deals, dashboard, onboarding)
- `apps/web/src/components/ui/` - 15 shadcn/ui components (Button, Card, Dialog, etc.)
- `apps/web/src/components/layout/` - AppShell, Sidebar, Header, UserMenu
- `apps/web/src/components/contacts/` - CreateContactDialog
- `apps/web/src/components/deals/` - KanbanBoard, KanbanColumn, DealCard, CreateDealDialog
- `apps/web/src/components/activities/` - ActivityTimeline
- `apps/web/src/components/onboarding/` - OnboardingWizard, StepIndicator, GmailStep, SlackStep, WhatsAppStep
- `apps/web/src/pages/` - All route pages (Dashboard, Contacts, Deals, Activities, Settings)
- `apps/web/src/hooks/` - useToast, useContacts, useDeals
- `apps/web/src/stores/` - authStore, uiStore (Zustand)
- `apps/web/src/routes/` - ProtectedRoute, OnboardingGuard
- `apps/web/src/styles/globals.css` - Tailwind v4 theme with LEAN brand colors

### Features Implemented
1. **Auth Flow:** Login, Register, Google OAuth callback, JWT token management
2. **Onboarding Wizard:** 3-step wizard (Gmail, Slack, WhatsApp) with skip/complete
3. **Dashboard:** Stats cards, AI briefing card, recent activities, upcoming tasks
4. **Contacts:** List with search/pagination, detail page with activity timeline
5. **Deals:** Kanban board with drag-drop, pipeline selector, create/edit dialogs
6. **Activities:** Timeline with type filtering
7. **Settings:** Profile, Integrations, Team, Company pages

### Verification
- TypeScript typecheck: Passes
- Vite build: Successful (745 kB JS bundle)
- Dev server: http://localhost:3001 with API proxy to http://localhost:3000

### Decisions
- Light mode only (dark mode deferred)
- Premium "boutique CRM" aesthetic with LEAN brand violet (#6b459b) accent
- CSS-based Tailwind v4 config (no tailwind.config.ts)

### Next Steps
1. Integrate frontend with backend API
2. Test full auth flow end-to-end
3. Deploy frontend to staging
4. Add loading states and error handling refinements

---

## [17 January 2026] - Remove WhatsApp Extension (Session 15)

### Accomplished
- Removed WhatsApp Chrome extension (deferred to Phase 4)
- Removed WhatsApp API module from NestJS API
- Updated project documentation to reflect changes

### Removed
- `apps/whatsapp-extension/` - Entire Chrome extension directory
- `apps/api/src/modules/whatsapp/` - WhatsApp API module (controller, service, DTOs)

### Modified
- `apps/api/src/app.module.ts` - Removed WhatsAppModule import
- `PROJECT-TODO.md` - Moved WhatsApp integration to Phase 4

### Decision
- WhatsApp integration deferred to Phase 4 (future)
- Will revisit with either Chrome extension approach or official WhatsApp Business API

---

## [17 January 2026] - WhatsApp Extension Testing (Session 14)

### Accomplished
- Tested WhatsApp Chrome extension end-to-end
- Fixed multiple extension configuration issues
- Verified API endpoint connectivity
- Confirmed DOM selectors find WhatsApp messages

### What Worked
- **Extension loading:** Loads in Chrome via `chrome://extensions/` developer mode
- **Configuration saving:** Popup saves API URL and auth token to chrome.storage
- **Token validation:** Background script validates JWT against `/api/v1/users/me`
- **API connectivity:** WhatsApp API endpoints (`/whatsapp/messages`, `/whatsapp/stats`) respond correctly
- **DOM selectors:** Updated selectors find messages (`.message-in`, `.message-out`, `header span[title]`)

### What Did NOT Work
- **Message capture:** Content script finds messages but `processMessage()` doesn't capture them
- **Root cause:** The processing logic has a bug - messages are found by selectors but not added to `capturedMessages` Map
- **Not fixed:** Determined not worth debugging further as WhatsApp extension is temporary/not part of final product

### Fixes Applied
1. **manifest.json:** Removed `"type": "module"` (was preventing service worker from loading)
2. **manifest.json:** Added `alarms`, `tabs` permissions and `http://localhost:3000/*` to host_permissions
3. **background.js:** Changed validation endpoint from `/api/v1/auth/me` to `/api/v1/users/me`
4. **background.js:** Added null check for `chrome.alarms` API
5. **background.js:** Added detailed console logging for debugging
6. **popup.js:** Added try/catch error handling and console logging
7. **content.js:** Updated DOM selectors for current WhatsApp Web structure:
   - `MESSAGE_IN`: `.message-in` (was `[data-testid="msg-container"].message-in`)
   - `MESSAGE_OUT`: `.message-out` (was `[data-testid="msg-container"].message-out`)
   - `MESSAGE_TEXT`: `.copyable-text` (was `[data-testid="msg-text"]`)
   - `MESSAGE_TIME`: `[data-pre-plain-text]` attribute
8. **content.js:** Added `parsePrePlainText()` function for new timestamp format

### Lessons Learned (IMPORTANT for Future Sessions)
1. **WhatsApp Web DOM changes frequently** - Selectors that worked before may not work now
2. **Chrome extension debugging:** Use Service Worker DevTools AND popup DevTools (right-click popup → Inspect)
3. **Manifest V3 quirks:** Don't use `"type": "module"` unless background.js uses ES module imports
4. **API endpoint naming:** The API has `/users/me` not `/auth/me` for current user info
5. **TypeScript build cache:** Delete `tsconfig.tsbuildinfo` if builds seem stuck/empty
6. **Token for testing:** Login returns JWT valid for 7 days, use for manual API testing

### Decision
- WhatsApp extension is **temporary tool**, not part of final product
- Message capture bug exists but not worth fixing
- Extension infrastructure (config, API, auth) works correctly
- Can revisit if WhatsApp integration becomes a priority

### Files Modified
- `apps/whatsapp-extension/manifest.json`
- `apps/whatsapp-extension/src/scripts/background.js`
- `apps/whatsapp-extension/src/scripts/content.js`
- `apps/whatsapp-extension/src/popup/popup.js`

### Next Steps
1. Deploy to staging for production testing
2. Build frontend onboarding UI (Phase 4)
3. Microsoft 365 integration (Phase 4)

---

## [17 January 2026] - Onboarding Wizard & WhatsApp Icons (Session 13)

### Accomplished
- Built complete onboarding wizard API module
- Created WhatsApp extension icons (LEAN brand violet)
- Added database migration for onboarding state tracking

### Onboarding Module Features
- **OnboardingState entity:** Tracks user progress through Gmail, Calendar, Slack, WhatsApp steps
- **GET /onboarding/status:** Returns current step, completion percentage, and integration statuses
- **GET /onboarding/google-auth-url:** Generates Google OAuth URL with state parameter
- **GET /onboarding/slack-install-url:** Generates Slack OAuth installation URL
- **GET /onboarding/whatsapp-extension:** Returns extension download info and long-lived API token
- **POST /onboarding/complete-step:** Mark a step as complete
- **POST /onboarding/skip-step:** Skip a step with optional reason
- **POST /onboarding/skip:** Skip entire onboarding
- **POST /onboarding/reset:** Reset onboarding to start over

### New Files
- `packages/database/src/entities/onboarding-state.entity.ts` - State tracking entity
- `packages/database/src/migrations/1768652318024-AddOnboardingState.ts` - Migration
- `apps/api/src/modules/onboarding/` - Complete module (controller, service, DTOs)
- `apps/whatsapp-extension/src/icons/icon16.png` - 16x16 extension icon
- `apps/whatsapp-extension/src/icons/icon48.png` - 48x48 extension icon
- `apps/whatsapp-extension/src/icons/icon128.png` - 128x128 extension icon

### Modified Files
- `packages/database/src/index.ts` - Export OnboardingState
- `packages/database/src/data-source.ts` - Add OnboardingState to entities
- `apps/api/src/app.module.ts` - Import OnboardingModule

### Technical Details
- Onboarding status automatically syncs with actual integration states
- Status endpoint checks user_integrations and slack_installations tables
- Progress calculated as percentage of connected integrations
- WhatsApp extension token valid for 365 days

### Next Steps
1. Test WhatsApp extension end-to-end
2. Build frontend onboarding UI (future Phase 4)
3. Deploy to staging for production testing

---

## [17 January 2026] - WhatsApp Extension & P2 Security (Session 12)

### Accomplished
- Completed all P2 security items
- Built WhatsApp Chrome extension for web.whatsapp.com message capture
- Created WhatsApp API endpoint with phone number matching

### Security Fixes (P2)
- **DB_SYNCHRONIZE:** Changed from NODE_ENV-based to explicit opt-in via `DB_SYNCHRONIZE=true`
- **OAuth Redirect Validation:** Frontend URL now validated against CORS_ORIGINS allowlist

### WhatsApp Extension Features
- Chrome Manifest V3 extension for web.whatsapp.com
- Content script captures messages in real-time
- Background service worker for API communication
- Popup UI for configuration (API URL, auth token, enable/disable)
- Message batching and periodic sync (30-second intervals)

### WhatsApp API Endpoint
- `POST /api/v1/whatsapp/messages` - Receive messages from extension
- `GET /api/v1/whatsapp/stats` - Get sync statistics
- Phone number normalization (handles Kuwait +965 prefix)
- Contact matching by phone (exact and partial) or name
- Auto-creates contacts from unknown numbers
- Creates activities linked to contacts

### New Files
- `apps/whatsapp-extension/manifest.json` - Chrome extension manifest
- `apps/whatsapp-extension/src/scripts/content.js` - Message capture script
- `apps/whatsapp-extension/src/scripts/background.js` - Service worker
- `apps/whatsapp-extension/src/popup/popup.html` - Configuration UI
- `apps/whatsapp-extension/src/popup/popup.js` - Popup logic
- `apps/api/src/modules/whatsapp/` - WhatsApp module (controller, service, DTOs)

### Modified Files
- `apps/api/src/app.module.ts` - Added WhatsAppModule
- `apps/api/src/config/configuration.ts` - Added frontend.allowedRedirects
- `apps/api/src/modules/auth/auth.controller.ts` - Added redirect URL validation
- `.env.example` - Added DB_SYNCHRONIZE documentation

### Next Steps
1. Build guided onboarding wizard
2. Test WhatsApp extension end-to-end
3. Create extension icons

---

## [17 January 2026] - Security Hardening & Activity Logging (Session 11)

### Accomplished
- Implemented activity logging via Slack chat
- Added JWT_SECRET fail-fast validation for production environments
- Added ENCRYPTION_KEY validation for production
- Created MergeContactsDto with UUID validation for contact merge endpoint
- Reviewed npm audit vulnerabilities (remaining issues are in dev dependencies only)

### Security Improvements
- **JWT_SECRET Validation:** API now fails to start in production if:
  - JWT_SECRET is not set
  - JWT_SECRET uses the default development value
  - JWT_SECRET is shorter than 32 characters
- **ENCRYPTION_KEY Validation:** API requires ENCRYPTION_KEY in production
- **UUID Validation:** Contact merge endpoint now validates UUID format in request body

### New Features
- **Activity Logging via Slack:** Users can log activities by typing natural language:
  - "Just had a call with Ahmed about the cloud migration"
  - "Met with Fatima to discuss the proposal"
  - "Note: Sara mentioned they need faster delivery"
- Activities are saved to database with contact linking and lastContactedAt update
- **Tested and confirmed working** in LEAN Sandbox Slack workspace

### Files Added
- `apps/api/src/modules/contacts/dto/merge-contacts.dto.ts`

### Files Changed
- `apps/api/src/main.ts` - Added validateEnvironment() with security checks
- `apps/api/src/modules/contacts/contacts.controller.ts` - Use MergeContactsDto
- `apps/slack-bot/src/commands/index.ts` - Implemented handleActivityLog()
- `package.json` - Added tar override attempt (dev deps remain vulnerable)

### Next Steps
1. Address P2 security items (DB_SYNCHRONIZE, OAuth redirect validation)
2. Start WhatsApp Chrome extension (Phase 3)
3. Test full Slack bot flow end-to-end

---

## [17 January 2026] - Slack Bot & Local LLM Integration (Session 10)

### Accomplished
- Created Slack app with Socket Mode enabled
- Connected Slack bot to LEAN Sandbox workspace
- Added local LLM support (Ollama) as alternative to Anthropic API
- Installed and configured Qwen 2.5:7b for AI features
- Fixed TypeScript build errors in slack-bot package
- Implemented company lookup with abbreviation/initials matching (NBK → National Bank of Kuwait)
- Added deal status handler for natural language queries
- Successfully tested morning briefing generation with local LLM
- Successfully tested company lookup queries with local LLM

### Decisions
- Use Qwen 2.5:7b as the default local LLM (best balance of JSON output quality and performance)
- Support multiple AI providers: Anthropic, Ollama, OpenAI-compatible APIs
- Company search matches by name, partial name, and initials (skipping common words like "of", "the")

### Added/Changed
- `packages/ai-client/src/client.ts` - Added multi-provider support (Anthropic, Ollama, OpenAI)
- `packages/ai-client/package.json` - Added OpenAI SDK dependency
- `apps/slack-bot/src/commands/index.ts` - Added company lookup, deal status handlers, NL parser logging
- `apps/slack-bot/src/main.ts` - Fixed .env.local path resolution
- `apps/slack-bot/src/events/index.ts` - Fixed unused variable warnings
- `apps/slack-bot/src/stores/installation-store.ts` - Fixed unused property warning
- `.env.local` - Added AI_PROVIDER, AI_MODEL, AI_BASE_URL for Ollama config
- Database: Created slack_installations record linking workspace to tenant

### Technical Details
- Ollama endpoint: `http://localhost:11434/v1` (OpenAI-compatible)
- Socket Mode eliminates need for public HTTPS URL during development
- Company initials matching uses PostgreSQL string_agg with word filtering

### Next Steps
1. Test remaining Slack commands (deals list, stale contacts)
2. Commit all changes to git
3. Continue with WhatsApp Chrome extension (Phase 3)
4. Address remaining P1 security items

---

## [17 January 2026] - Slack App Setup Preparation (Session 9)

### Accomplished
- Reviewed project status and loaded session context
- Prepared step-by-step Slack app creation guide for user
- Confirmed setup documentation is complete and accurate

### Status
- Awaiting user to create Slack app at api.slack.com with Socket Mode
- All code and documentation ready for Slack bot testing

### Next Steps
1. User creates Slack app with Socket Mode enabled
2. User obtains `xapp-` (App Token) and `xoxb-` (Bot Token)
3. Configure `.env.local` with tokens
4. Test Slack bot locally with `/leancrm` command
5. Link Slack workspace to tenant in database

---

## [17 January 2026] - Security Fixes & Morning Briefing (Session 8)

### Accomplished
- Fixed all P0 critical security vulnerabilities
- Added token encryption for OAuth credentials at rest
- Updated Slack setup documentation for Socket Mode
- Implemented AI-powered morning briefing generator

### Security Fixes

**Cross-Tenant Access Vulnerability (P0):**
- Added `findByIdAndTenant()`, `updateByTenant()`, `softDeleteByTenant()` to UsersService
- Updated UsersController to verify tenant ownership on all user operations
- Admin users can now only access users within their own tenant

**OAuth Token Encryption (P0):**
- Created `packages/database/src/utils/encryption.ts` with AES-256-GCM encryption
- Added TypeORM transformer for automatic encrypt/decrypt on save/load
- Applied to `UserIntegration.accessToken`, `UserIntegration.refreshToken`
- Applied to `SlackInstallation.botAccessToken`
- Graceful degradation: stores unencrypted in dev if ENCRYPTION_KEY not set

**Password Field Protection (P1):**
- Added `@Exclude()` decorator to User.password field
- Prevents password hash from leaking in API responses via class-transformer

### Morning Briefing Feature
- Created `MorningBriefingGenerator` class in ai-client package
- Generates personalized daily briefings with AI analysis
- Added `/leancrm brief` command to Slack bot
- Briefing includes:
  - Greeting and day-at-a-glance summary
  - Meeting prep notes with suggested talking points
  - Deals needing attention with urgency levels
  - Task reminders and daily goals
  - Motivational note
- Formatted for Slack with proper markdown and emojis

### Modified Files
- `apps/api/src/modules/users/users.controller.ts` - Tenant-aware endpoints
- `apps/api/src/modules/users/users.service.ts` - Tenant-aware methods
- `packages/database/src/entities/user-integration.entity.ts` - Encrypted tokens
- `packages/database/src/entities/slack-installation.entity.ts` - Encrypted token
- `packages/database/src/entities/user.entity.ts` - @Exclude password
- `apps/slack-bot/src/commands/index.ts` - Added brief command handler
- `.env.example` - Added ENCRYPTION_KEY variable
- `technical/SETUP.md` - Detailed Socket Mode setup instructions

### New Files
- `packages/database/src/utils/encryption.ts` - Encryption utilities
- `packages/ai-client/src/generators/morning-briefing.ts` - AI briefing generator

### Next Steps
1. Create Slack app with Socket Mode at api.slack.com
2. Test Slack bot locally

---

## [17 January 2026] - Slack Socket Mode & Security Audit (Session 7)

### Accomplished
- Enabled Socket Mode for Slack bot (local development without public URL)
- Completed comprehensive security audit of the entire codebase
- Documented all security findings with remediation recommendations

### Slack Bot Updates
- Added Socket Mode support for local development
- Bot auto-detects mode based on SLACK_APP_TOKEN environment variable
- No public URL or HTTPS required for local Slack testing
- Updated .env.example with Socket Mode configuration

### Security Audit Findings

**Critical (3 issues):**
1. OAuth tokens stored in plain text in database
2. Slack bot tokens stored in plain text
3. Cross-tenant user access vulnerability in UsersController

**High (4 issues):**
4. Default JWT secret used when not configured
5. NPM dependency vulnerabilities (glob, tar, @nestjs/cli)
6. Password field not excluded from serialization
7. Merge endpoint missing UUID validation in body

**Medium (2 issues):**
8. DB synchronize based on NODE_ENV
9. OAuth redirect URL not validated

**Security Best Practices Already Present:**
- Helmet middleware for security headers
- ValidationPipe with whitelist mode
- Rate limiting (100 req/60s)
- Parameterized queries (no SQL injection)
- bcrypt password hashing (12 rounds)
- Tenant isolation in most queries

### New Files
- `technical/SECURITY-AUDIT.md` - Full security audit report with recommendations

### Modified Files
- `apps/slack-bot/src/main.ts` - Added Socket Mode support
- `.env.example` - Added SLACK_APP_TOKEN and SLACK_BOT_TOKEN
- `PROJECT-TODO.md` - Added Security Hardening section, updated Slack tasks

### Next Steps
1. Fix P0 security issues (cross-tenant access, token encryption)
2. Create Slack app with Socket Mode enabled
3. Test Slack bot locally
4. Continue with morning briefing generator

---

## [17 January 2026] - Docker Production Setup & AI Features (Session 6)

### Accomplished
- Created production-ready Docker deployment configuration
- Implemented AI entity extraction with contact enrichment
- Added sentiment analysis to email activities
- Built duplicate contact detection system
- Added contact merge functionality

### Docker & Deployment
- Created multi-stage Dockerfile for all apps (api, sync-service, slack-bot)
- Created docker-compose.prod.yml with Traefik reverse proxy for automatic HTTPS
- Added .dockerignore for optimized builds
- Added .env.prod.example template with all required variables
- Updated technical/deployment.md with comprehensive production deployment guide

### AI Features (Phase 2)
- **Entity Extraction:** Enhanced email sync to extract contacts, deals, action items from emails
- **Contact Enrichment:** Automatically updates contact records with extracted data (title, phone, name)
- **Task Creation:** Auto-creates tasks from high-confidence action items found in emails
- **Sentiment Analysis:** Analyzes each email for sentiment, buying signals, and risk indicators
- **Duplicate Detection:** Three-tier system (exact match, fuzzy name, AI-based) for finding duplicate contacts
- **Contact Merge:** API endpoint to merge duplicate contacts with full activity/deal reassignment

### New Files
- `Dockerfile` - Multi-stage build for all apps
- `.dockerignore` - Optimized Docker context
- `infrastructure/docker/docker-compose.prod.yml` - Production orchestration with Traefik
- `infrastructure/docker/.env.prod.example` - Production environment template
- `packages/ai-client/src/analyzers/duplicate-detector.ts` - Duplicate detection logic

### Modified Files
- `apps/sync-service/src/workers/email-sync.worker.ts` - Added AI analysis pipeline
- `apps/api/src/modules/contacts/contacts.service.ts` - Added duplicate detection and merge
- `apps/api/src/modules/contacts/contacts.controller.ts` - Added duplicate/merge endpoints
- `packages/ai-client/src/index.ts` - Exported DuplicateDetector
- `technical/deployment.md` - Comprehensive production deployment guide

### API Endpoints Added
- `GET /api/v1/contacts/duplicates/detect` - Detect duplicate contacts
- `POST /api/v1/contacts/merge` - Merge two contacts

### Next Steps
- Deploy to staging server with HTTPS
- Test Slack bot OAuth
- Implement morning briefing generator
- Start WhatsApp Chrome extension

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

### Git Repository
- Initialized git repository on `main` branch
- Created initial commit with 114 files (24,105 lines)
- Commit: `ff5b265 Initial commit: InviCRM MVP foundation`

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
