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
*Last Updated: 17 January 2026*
