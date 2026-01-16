# InviCRM - Project Tasks

## Status Legend
- `[ ]` Pending
- `[~]` In Progress
- `[x]` Completed
- `[?]` Blocked

---

## Phase 1: Foundation (Week 1-2)

### Project Setup
- [x] Create monorepo structure (Turborepo)
- [x] Set up TypeScript configuration
- [x] Create NestJS API app
- [x] Create sync-service app
- [x] Create slack-bot app
- [x] Create shared packages (database, shared, ai-client)
- [x] Set up Docker Compose
- [x] Set up Claude memory system (CLAUDE.md, TODO, commands)

### External Services Setup
- [x] Create Google Cloud project (invicrm-484520)
- [x] Enable Gmail API
- [x] Enable Calendar API
- [x] Configure OAuth consent screen
- [x] Create OAuth 2.0 credentials
- [?] Create Slack app at api.slack.com (blocked: requires HTTPS for OAuth)
- [?] Configure Slack OAuth scopes (blocked: requires HTTPS for OAuth)
- [?] Create slash command /leancrm (blocked: requires HTTPS for OAuth)
- [ ] Get Anthropic API key (optional for AI features)

### Database & Auth
- [x] Run first TypeORM migration
- [x] Test user registration
- [x] Test JWT authentication
- [x] Test Google OAuth flow (with refresh token)
- [x] Create seed data for development

### Gmail Integration
- [x] Complete OAuth flow with Gmail scopes
- [x] Test 90-day historical import (1800+ emails synced)
- [x] Test incremental sync (via History API)
- [x] Test contact auto-creation from emails (200+ contacts)
- [x] Test email thread association (threadId stored)

### Slack Bot
- [?] Test OAuth installation to workspace (blocked: requires HTTPS/staging server)
- [?] Link Slack workspace to tenant (blocked: requires HTTPS/staging server)
- [?] Test /leancrm command (blocked: requires HTTPS/staging server)
- [?] Test contact lookup queries (blocked: requires HTTPS/staging server)
- [?] Test activity logging via chat (blocked: requires HTTPS/staging server)

---

## Phase 2: Intelligence (Week 3)

### AI Features
- [ ] Test entity extraction from emails
- [ ] Implement duplicate detection
- [ ] Add sentiment analysis to activities
- [ ] Create morning briefing generator

### Calendar Integration
- [x] Test Google Calendar sync (worker implemented and bug-fixed)
- [x] Auto-log external meetings (creates activities for external meetings)
- [x] Extract participants as contacts (auto-creates contacts from attendees)

---

## Phase 3: Expansion (Week 4)

### WhatsApp Extension
- [ ] Create Chrome extension manifest
- [ ] Build content script for web.whatsapp.com
- [ ] Implement message capture
- [ ] Phone number matching to contacts

### Onboarding
- [ ] Build guided onboarding wizard
- [ ] Gmail connection step
- [ ] Calendar connection step
- [ ] Slack installation step
- [ ] WhatsApp extension prompt

---

## Phase 4: Polish (Future)

- [ ] Microsoft 365 integration
- [ ] Teams bot
- [ ] Arabic NLP support
- [ ] Multi-tenant billing
- [ ] SSO (SAML/OIDC)
- [ ] Public API

---

## Questions to Resolve

1. Which LEAN Services cloud region for deployment? (UAE vs KSA)
2. Payment gateway preference? (MyFatoorah vs Tap)
3. Mobile app priority? (React Native vs defer)

---

## Notes

- Slack bot uses single app with OAuth per workspace (not per-tenant apps)
- Default currency is KWD, configurable per tenant
- Email sync runs every 5 minutes, calendar every 15 minutes
- PostgreSQL runs on port 5433 (to avoid conflicts with existing installations)
- See `technical/SETUP.md` for complete setup instructions
- **Test Credentials:** admin@lean-demo.com / password123
- **Seed Data:** Run `npm run seed` from packages/database (use `--force` to re-seed)

---
*Last Updated: 17 January 2026 (Session 5)*
