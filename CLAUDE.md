# InviCRM - Project Context

## Overview

**InviCRM** (Invisible CRM) is an AI-powered CRM system built on the philosophy that "the best CRM is one you never have to use." It automatically captures relationship intelligence from communication channels (Gmail, Calendar, WhatsApp) and surfaces insights through conversational interfaces (Slack).

**Target Market:** Small-to-medium B2B sales teams (5-50 reps) in the GCC region.

**Status:** Phase 1 Development (MVP)

## Key Principles

1. **Zero Manual Data Entry** - Auto-capture from all channels
2. **Conversation-First** - Talk to CRM like a colleague via Slack
3. **Proactive Intelligence** - Push insights without being asked
4. **Lives Where Users Live** - Embedded in Slack/Teams/WhatsApp
5. **Multi-Tenant SaaS** - Each tenant admin OAuth-connects their own integrations

## Architecture

### Monorepo Structure (Turborepo)
```
InviCRM/
├── apps/
│   ├── api/              # NestJS Core API (port 3000)
│   ├── sync-service/     # BullMQ workers for email/calendar sync
│   └── slack-bot/        # Multi-tenant Slack bot (port 3002)
├── packages/
│   ├── database/         # TypeORM entities & migrations
│   ├── shared/           # Types, constants, utilities
│   └── ai-client/        # Claude API wrapper
├── infrastructure/
│   └── docker/           # Docker Compose for local dev
└── technical/            # Technical documentation
```

### Technology Stack
- **Runtime:** Node.js 20+ with TypeScript (strict mode)
- **API Framework:** NestJS 10
- **Database:** PostgreSQL 15 with TypeORM
- **Cache/Queue:** Redis 7 + BullMQ
- **AI/LLM:** Claude API (Anthropic)
- **Slack:** Bolt SDK with OAuth installation flow

### Database Entities (12 tables)
- `tenants`, `users`, `user_integrations`
- `contacts`, `companies`, `deals`, `pipelines`, `stages`
- `activities`, `tasks`
- `email_sync_states`, `slack_installations`

## GCC Regional Requirements

- **Data Residency:** Primary deployment in UAE/KSA regions
- **Arabic Support:** RTL interface, Arabic NLP (future)
- **Currency:** KWD default, supports AED, SAR, USD
- **Date Format:** DD Month YYYY (e.g., 15 January 2026)
- **WhatsApp-First:** Deep integration for GCC market preference

## Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Foundation - Gmail, Calendar, Slack bot | In Progress |
| 2 | Intelligence - AI briefings, sentiment, web dashboard | Pending |
| 3 | Expansion - Microsoft 365, Teams, Arabic NLP | Pending |
| 4 | Product - Multi-tenant billing, SSO, API | Pending |

## External Services Required

| Service | Purpose | Setup Location |
|---------|---------|----------------|
| Google Cloud | Gmail & Calendar OAuth | console.cloud.google.com |
| Slack | Bot OAuth | api.slack.com/apps |
| Anthropic | Claude AI | console.anthropic.com |

## Key Files

| File | Purpose |
|------|---------|
| `CHANGELOG.md` | Session history log |
| `PROJECT-TODO.md` | Persistent task tracker |
| `technical/architecture.md` | System design details |
| `technical/api-reference.md` | API endpoints documentation |
| `.env.example` | Environment variables template |

## Working with This Project

This project uses a **Claude Memory System** for context persistence:

1. **Start of session:** Run `/start-session` to load context
2. **End of session:** Run `/save-session` to persist progress
3. **Task tracking:** Update `PROJECT-TODO.md` as work progresses

## Reference Documents

- `/Users/mulaifi/Documents/LEAN CRM Project/LEAN_CRM_PRD.md` - Full PRD
- `/Users/mulaifi/Documents/LEAN CRM Project/05_User_Stories.md` - User stories
- `/Users/mulaifi/Documents/LEAN CRM Project/03_Slack_Strategy.md` - Slack details
- `/Users/mulaifi/Documents/LEAN CRM Project/02_WhatsApp_Strategy.md` - WhatsApp approach

---
*Last Updated: 16 January 2026*
