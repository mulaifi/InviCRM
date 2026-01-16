# InviCRM Testing Strategy

## Test Pyramid

```
         /\
        /  \     E2E Tests (few)
       /----\    - Full user flows
      /      \   - Slack bot interactions
     /--------\
    / Integration \  Integration Tests (some)
   /   Tests       \ - API endpoints
  /----------------\ - Database operations
 /    Unit Tests    \ Unit Tests (many)
/____________________\ - Services, utilities
                       - AI parsers
```

## Running Tests

```bash
# All tests
npm test

# Specific app
npm test -w @invicrm/api

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## Unit Tests

### Location
- `apps/api/src/**/*.spec.ts`
- `packages/*/src/**/*.spec.ts`

### What to Test
- Service methods
- Utility functions
- AI parsing logic
- Date/currency formatters

### Example
```typescript
// contacts.service.spec.ts
describe('ContactsService', () => {
  it('should create contact with company from email domain', async () => {
    const contact = await service.create(tenantId, {
      firstName: 'John',
      email: 'john@acme.com',
    });

    expect(contact.companyId).toBeDefined();
    expect(contact.company.domain).toBe('acme.com');
  });
});
```

## Integration Tests

### Location
- `apps/api/test/*.e2e-spec.ts`

### What to Test
- API endpoint responses
- Authentication flows
- Database transactions
- Multi-tenant isolation

### Example
```typescript
// auth.e2e-spec.ts
describe('Auth (e2e)', () => {
  it('/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'Test',
        lastName: 'User',
      });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeDefined();
  });
});
```

## Mocking External Services

### Gmail API
```typescript
jest.mock('googleapis', () => ({
  google: {
    gmail: jest.fn(() => ({
      users: {
        messages: {
          list: jest.fn().mockResolvedValue({ data: { messages: [] } }),
          get: jest.fn().mockResolvedValue({ data: mockEmail }),
        },
      },
    })),
  },
}));
```

### Claude API
```typescript
jest.mock('@invicrm/ai-client', () => ({
  AIClient: jest.fn().mockImplementation(() => ({
    completeJSON: jest.fn().mockResolvedValue({
      contacts: [{ name: 'John Doe', confidence: 0.9 }],
    }),
  })),
}));
```

## Test Data

### Factories
Create test data factories for consistent test setup:
```typescript
// test/factories/contact.factory.ts
export const createTestContact = (overrides = {}) => ({
  firstName: 'Test',
  lastName: 'Contact',
  email: 'test@example.com',
  tenantId: 'test-tenant-id',
  ...overrides,
});
```

### Seed Data
```bash
npm run db:seed  # Populate dev database with sample data
```

## CI/CD Testing

```yaml
# Example GitHub Actions
test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:15
    redis:
      image: redis:7
  steps:
    - npm ci
    - npm run typecheck
    - npm run lint
    - npm test -- --coverage
```

---
*Last Updated: 16 January 2026*
