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
- [x] Create Slack app at api.slack.com (Socket Mode enabled)
- [x] Configure Slack OAuth scopes
- [x] Create slash command /leancrm
- [x] Configure local LLM (Ollama with Qwen 2.5:7b) as alternative to Anthropic

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
- [x] Create Slack app at api.slack.com with Socket Mode enabled
- [x] Generate App-Level Token (xapp-) with connections:write scope
- [x] Test Socket Mode connection to workspace
- [x] Link Slack workspace to tenant (LEAN Sandbox → LEAN Services Demo)
- [x] Test /leancrm command (help, brief)
- [x] Test company lookup queries (NBK → National Bank of Kuwait)
- [x] Test contact lookup queries
- [x] Implement activity logging via Slack chat

---

## Phase 2: Intelligence (Week 3)

### AI Features
- [x] Entity extraction from emails (extracts contacts, deals, action items)
- [x] Implement duplicate detection (exact, fuzzy, and AI-based)
- [x] Add sentiment analysis to activities (buying signals, risk indicators)
- [x] Create morning briefing generator (`/leancrm brief` command)

### Calendar Integration
- [x] Test Google Calendar sync (worker implemented and bug-fixed)
- [x] Auto-log external meetings (creates activities for external meetings)
- [x] Extract participants as contacts (auto-creates contacts from attendees)

---

## Phase 3: Expansion (Week 4)

### WhatsApp Extension
- [x] Create Chrome extension manifest
- [x] Build content script for web.whatsapp.com
- [x] Implement message capture
- [x] Phone number matching to contacts
- [x] Create WhatsApp API endpoint in NestJS

### Onboarding
- [x] Build guided onboarding wizard
- [x] Gmail connection step
- [x] Calendar connection step
- [x] Slack installation step
- [x] WhatsApp extension prompt

---

## Security Hardening (Pre-Production)

### Critical (P0)
- [x] Fix cross-tenant user access vulnerability in UsersController
- [x] Encrypt OAuth tokens at rest (Google, Slack)
- [x] Add ENCRYPTION_KEY to environment variables

### High (P1)
- [x] Fail fast if JWT_SECRET not set in production
- [x] Review npm dependencies (remaining vulnerabilities are in dev dependencies)
- [x] Add @Exclude decorator to User.password field
- [x] Create DTO with UUID validation for contact merge endpoint

### Medium (P2)
- [x] Change DB_SYNCHRONIZE to explicit opt-in
- [x] Validate OAuth redirect URLs against allowlist

See `technical/SECURITY-AUDIT.md` for full details.

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

- Slack bot supports **Socket Mode** for local development (no public URL needed)
- Slack bot uses single app with OAuth per workspace (not per-tenant apps)
- Default currency is KWD, configurable per tenant
- Email sync runs every 5 minutes, calendar every 15 minutes
- PostgreSQL runs on port 5433 (to avoid conflicts with existing installations)
- See `technical/SETUP.md` for complete setup instructions
- See `technical/deployment.md` for production deployment with Docker/Traefik
- See `technical/SECURITY-AUDIT.md` for security findings and recommendations
- **Test Credentials:** admin@lean-demo.com / password123
- **Seed Data:** Run `npm run seed` from packages/database (use `--force` to re-seed)
- **AI Features:** Support Ollama (local) or Anthropic API (cloud)
- **Local LLM:** Qwen 2.5:7b recommended for best JSON output
- **AI Config:** Set AI_PROVIDER=ollama, AI_MODEL=qwen2.5:7b in .env.local

---
*Last Updated: 17 January 2026 (Session 13)*
