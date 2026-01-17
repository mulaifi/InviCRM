# InviCRM API Reference

Base URL: `http://localhost:3000/api/v1`

## Authentication

### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp"
}

Response: { user, accessToken, expiresIn }
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response: { user, accessToken, expiresIn }
```

### Google OAuth
```
GET /auth/google          # Initiates OAuth flow
GET /auth/google/callback # OAuth callback (redirects to frontend)
```

## Contacts

All endpoints require: `Authorization: Bearer <token>`

### List Contacts
```
GET /contacts?page=1&limit=50&search=john&companyId=uuid

Response: { data: Contact[], total, page, limit }
```

### Get Contact
```
GET /contacts/:id

Response: Contact with company, activities relations
```

### Create Contact
```
POST /contacts
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+965-1234-5678",
  "title": "Sales Director",
  "companyId": "uuid"
}
```

### Update Contact
```
PATCH /contacts/:id
{ ...partial fields }
```

### Delete Contact
```
DELETE /contacts/:id  # Soft delete
```

### Detect Duplicates
```
GET /contacts/duplicates/detect?useAI=true&minConfidence=0.5

Response: {
  duplicates: [
    {
      contactId: "uuid",
      matchedContactId: "uuid",
      confidence: 0.95,
      matchReasons: ["Exact email match: john@example.com"],
      suggestedAction: "merge" | "review" | "ignore"
    }
  ],
  totalAnalyzed: 150
}
```

### Merge Contacts
```
POST /contacts/merge
{
  "primaryId": "uuid",    # Contact to keep
  "secondaryId": "uuid"   # Contact to merge into primary
}

Response: Contact (merged primary with updated data)
```

Note: Merging reassigns all activities and deals from secondary to primary contact.

## Deals

### List Deals
```
GET /deals?page=1&limit=50&pipelineId=uuid&stageId=uuid&ownerId=uuid

Response: { data: Deal[], total, page, limit }
```

### Get Deals Closing This Month
```
GET /deals/closing-this-month

Response: Deal[]
```

### Get Pipeline Stats
```
GET /deals/pipeline-stats?pipelineId=uuid

Response: {
  pipelineId, pipelineName,
  stages: [{ stageId, stageName, dealCount, totalValue, weightedValue }],
  totalDeals, totalValue, totalWeightedValue
}
```

### Create Deal
```
POST /deals
{
  "name": "Annual Contract",
  "amount": 50000,
  "currency": "KWD",
  "expectedCloseDate": "2026-02-28",
  "contactId": "uuid",
  "companyId": "uuid"
}
```

### Move Deal Stage
```
PATCH /deals/:id/stage/:stageId
```

## Activities

### List Activities
```
GET /activities?contactId=uuid&dealId=uuid&type=email&page=1&limit=50
```

### Get Recent Activities
```
GET /activities/recent?days=7&limit=20
```

### Get Contact Timeline
```
GET /activities/contact/:contactId/timeline?limit=50
```

### Create Activity
```
POST /activities
{
  "type": "call",
  "direction": "outbound",
  "subject": "Follow-up call",
  "body": "Discussed proposal...",
  "contactId": "uuid",
  "dealId": "uuid",
  "durationMinutes": 30
}
```

## Tasks

### List My Tasks
```
GET /activities/tasks?status=pending&contactId=uuid&dealId=uuid
```

### Create Task
```
POST /activities/tasks
{
  "title": "Send proposal",
  "description": "...",
  "priority": "high",
  "dueDate": "2026-01-20",
  "contactId": "uuid"
}
```

### Complete Task
```
PATCH /activities/tasks/:id/complete
```

## WhatsApp

### Sync Messages (from Chrome Extension)
```
POST /whatsapp/messages
Authorization: Bearer <token>

{
  "messages": [
    {
      "id": "msg_abc123",
      "chatId": "+96512345678",
      "chatName": "Ahmed Al-Sabah",
      "phone": "+96512345678",
      "text": "Looking forward to our meeting tomorrow",
      "timestamp": "2026-01-17T10:30:00Z",
      "direction": "incoming",
      "capturedAt": "2026-01-17T10:30:05Z"
    }
  ]
}

Response: {
  success: true,
  processed: 5,
  matched: 4,
  created: 1
}
```

### Get Sync Statistics
```
GET /whatsapp/stats
Authorization: Bearer <token>

Response: {
  totalMessages: 150,
  uniqueContacts: 25,
  lastSyncAt: "2026-01-17T10:30:00Z"
}
```

## Onboarding

All endpoints require: `Authorization: Bearer <token>`

### Get Onboarding Status
```
GET /onboarding/status

Response: {
  currentStep: "gmail" | "calendar" | "slack" | "whatsapp" | "complete",
  isComplete: false,
  gmail: { connected: false },
  calendar: { connected: false },
  slack: { connected: true, connectedAt: "...", externalId: "LEAN Sandbox" },
  whatsapp: { connected: false },
  progressPercent: 33
}
```

### Get Google OAuth URL
```
GET /onboarding/google-auth-url

Response: {
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth?...",
  state: "base64-encoded-state"
}
```

### Get Slack Install URL
```
GET /onboarding/slack-install-url

Response: {
  installUrl: "https://slack.com/oauth/v2/authorize?..."
}
```

### Get WhatsApp Extension Info
```
GET /onboarding/whatsapp-extension

Response: {
  chromeStoreUrl: "chrome://extensions/",
  manualInstallUrl: "http://localhost:3001/extensions/whatsapp",
  apiToken: "eyJ...",  // Long-lived token (365 days)
  apiBaseUrl: "http://localhost:3000"
}
```

### Complete Step
```
POST /onboarding/complete-step
{
  "step": "gmail" | "calendar" | "slack" | "whatsapp"
}

Response: { success: true, nextStep: "slack", message: "Step 'gmail' marked as complete" }
```

### Skip Step
```
POST /onboarding/skip-step
{
  "step": "gmail" | "calendar" | "slack" | "whatsapp",
  "reason": "Will connect later"  // optional
}

Response: { success: true, nextStep: "slack", message: "Step 'gmail' skipped" }
```

### Skip Entire Onboarding
```
POST /onboarding/skip

Response: { success: true, nextStep: "complete", message: "Onboarding skipped" }
```

### Reset Onboarding
```
POST /onboarding/reset

Response: { success: true, nextStep: "gmail", message: "Onboarding reset" }
```

## Users

### Get Current User
```
GET /users/me
```

### Update Profile
```
PATCH /users/me
{
  "firstName": "John",
  "lastName": "Doe",
  "timezone": "Asia/Kuwait"
}
```

### List Team Users (Admin only)
```
GET /users
```

---
*Last Updated: 17 January 2026 (Session 13)*
