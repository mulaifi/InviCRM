# InviCRM Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│  Slack Bot  │  Web App    │  Mobile App │  WhatsApp   │  API    │
│  (Phase 1)  │  (Phase 2)  │  (Phase 2)  │  Extension  │ Clients │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────┬────┘
       │             │             │             │           │
       └─────────────┴─────────────┴─────────────┴───────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │       API Gateway           │
                    │      (NestJS + JWT)         │
                    └──────────────┬──────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       │                           │                           │
┌──────▼──────┐           ┌────────▼────────┐         ┌────────▼────────┐
│   API App   │           │  Sync Service   │         │   Slack Bot     │
│  (NestJS)   │           │   (BullMQ)      │         │   (Bolt SDK)    │
└──────┬──────┘           └────────┬────────┘         └────────┬────────┘
       │                           │                           │
       └───────────────────────────┼───────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
       ┌──────▼──────┐      ┌──────▼──────┐     ┌──────▼──────┐
       │ PostgreSQL  │      │    Redis    │     │  Claude AI  │
       │   (Data)    │      │ (Cache/Queue│     │  (Anthropic)│
       └─────────────┘      └─────────────┘     └─────────────┘
```

## Multi-Tenancy Model

**Approach:** Shared database with row-level isolation via `tenant_id`

```sql
-- Every tenant-scoped table has:
tenant_id UUID NOT NULL REFERENCES tenants(id)

-- Queries always filter by tenant:
WHERE tenant_id = :tenantId AND is_deleted = false
```

**Tenant Hierarchy:**
```
Tenant
  └── Users (admin, manager, rep)
        └── User Integrations (Google, Slack tokens)
```

## Data Flow: Email Sync

```
1. User connects Gmail via OAuth
   └── Store tokens in user_integrations

2. Sync Service (BullMQ worker)
   ├── Initial: Import 90 days of emails
   └── Incremental: Poll every 5 minutes via History API

3. For each email:
   ├── Extract sender/recipient
   ├── Find or create Contact (by email)
   ├── Find or create Company (by domain)
   ├── Create Activity record
   └── AI: Extract entities (optional)

4. Update contact.last_contacted_at
```

## Data Flow: Slack Query

```
1. User types: /leancrm What's happening with John?

2. Slack Bot receives command
   ├── Get tenant_id from slack_installations
   └── Parse query with Claude AI (NaturalLanguageParser)

3. Query Handler
   ├── intent: contact_lookup
   ├── entities: { contactName: "John" }
   └── Execute database query

4. Format response as Slack blocks
   └── Return ephemeral message
```

## External Integrations

| Service | Auth Method | Token Storage |
|---------|-------------|---------------|
| Gmail | OAuth 2.0 | user_integrations |
| Calendar | OAuth 2.0 | user_integrations |
| Slack | OAuth 2.0 | slack_installations |
| Claude | API Key | Environment variable |

## Security Considerations

- **JWT tokens:** 7-day expiry, tenant_id in payload
- **OAuth tokens:** Encrypted at rest, auto-refresh
- **API rate limiting:** 100 requests/minute per user
- **Row-level security:** All queries scoped by tenant_id
- **Soft deletes:** Data never permanently deleted

---
*Last Updated: 16 January 2026*
