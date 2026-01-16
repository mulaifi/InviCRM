# InviCRM Security Audit Report

**Audit Date:** 17 January 2026
**Auditor:** Claude Code
**Scope:** Full codebase review

---

## Executive Summary

This security audit identified **3 critical**, **4 high**, and **2 medium** severity issues that should be addressed before production deployment. The codebase follows many security best practices but has gaps in credential storage and tenant isolation.

---

## Findings by Severity

### CRITICAL (Must Fix Before Production)

#### 1. OAuth Tokens Stored in Plain Text
**Location:** `packages/database/src/entities/user-integration.entity.ts:18-22`
**Risk:** If database is compromised, all user OAuth tokens are exposed, allowing attackers to access users' Gmail and Calendar data.

**Current Code:**
```typescript
@Column({ name: 'access_token', type: 'text', nullable: true })
accessToken: string;

@Column({ name: 'refresh_token', type: 'text', nullable: true })
refreshToken: string;
```

**Recommendation:** Encrypt tokens at rest using a key stored outside the database (e.g., AWS KMS, HashiCorp Vault, or environment variable with AES-256-GCM).

---

#### 2. Slack Bot Tokens Stored in Plain Text
**Location:** `packages/database/src/entities/slack-installation.entity.ts:20-21`
**Risk:** Compromised database exposes all Slack workspace tokens.

**Current Code:**
```typescript
@Column({ name: 'bot_access_token', type: 'text' })
botAccessToken: string;
```

**Recommendation:** Same as above. Encrypt all OAuth/API tokens at rest.

---

#### 3. Cross-Tenant Access Vulnerability in Users Controller
**Location:** `apps/api/src/modules/users/users.controller.ts:48-70`
**Risk:** Admin users can view and modify ANY user across ALL tenants by ID.

**Vulnerable Endpoints:**
- `GET /api/v1/users/:id` - Can view any user
- `PATCH /api/v1/users/:id` - Can modify any user
- `DELETE /api/v1/users/:id` - Can delete any user

**Current Code:**
```typescript
@Get(':id')
@Roles('admin')
async findOne(@Param('id', ParseUUIDPipe) id: string) {
  return this.usersService.findById(id); // No tenant check!
}
```

**Recommendation:** Add tenant verification to all user operations:
```typescript
@Get(':id')
@Roles('admin')
async findOne(
  @CurrentUser('tenantId') tenantId: string,
  @Param('id', ParseUUIDPipe) id: string,
) {
  return this.usersService.findByIdAndTenant(tenantId, id);
}
```

---

### HIGH (Fix Before Beta)

#### 4. Default JWT Secret Used When Not Configured
**Location:** `apps/api/src/config/configuration.ts:21`
**Risk:** If JWT_SECRET environment variable is not set, a predictable default is used, allowing token forgery.

**Current Code:**
```typescript
jwt: {
  secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
}
```

**Recommendation:** Fail fast if JWT_SECRET is not set in production:
```typescript
jwt: {
  secret: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    return secret || 'development-secret-change-in-production';
  })(),
}
```

---

#### 5. NPM Dependency Vulnerabilities
**Source:** `npm audit`
**Risk:** Known vulnerabilities in dependencies could be exploited.

**High Severity:**
- `@mapbox/node-pre-gyp` via `tar` - Archive extraction vulnerability
- `glob` (10.2.0-10.4.5) - Command injection via CLI
- `@nestjs/cli` - Multiple vulnerabilities

**Recommendation:** Update dependencies:
```bash
npm update @nestjs/cli @nestjs/swagger
npm audit fix
```

---

#### 6. Password Field Exposed in API Responses
**Location:** `packages/database/src/entities/user.entity.ts`
**Risk:** Password hash could leak in API responses if serialization is not careful.

**Mitigation Present:** `AuthService.sanitizeUser()` removes password before returning.

**Recommendation:** Add defense in depth with class-transformer:
```typescript
import { Exclude } from 'class-transformer';

@Column({ length: 255, nullable: true })
@Exclude()
password: string;
```

And enable transformation in main.ts (already partially done with `transform: true`).

---

#### 7. Merge Endpoint Missing UUID Validation
**Location:** `apps/api/src/modules/contacts/contacts.controller.ts:100-107`
**Risk:** Body parameters not validated as UUIDs could cause unexpected behavior.

**Current Code:**
```typescript
@Post('merge')
merge(
  @CurrentUser('tenantId') tenantId: string,
  @Body() body: { primaryId: string; secondaryId: string },
) {
```

**Recommendation:** Create a DTO with validation:
```typescript
class MergeContactsDto {
  @IsUUID()
  primaryId: string;

  @IsUUID()
  secondaryId: string;
}
```

---

### MEDIUM (Fix Before GA)

#### 8. Database Synchronize Enabled Based on NODE_ENV
**Location:** `apps/api/src/app.module.ts:35`
**Risk:** If NODE_ENV is accidentally not set to 'production', schema could auto-sync.

**Current Code:**
```typescript
synchronize: configService.get('NODE_ENV') === 'development',
```

**Recommendation:** Use explicit opt-in:
```typescript
synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
```

---

#### 9. Google OAuth Callback Redirects to Configurable URL
**Location:** `apps/api/src/modules/auth/auth.controller.ts:55-56`
**Risk:** Open redirect if FRONTEND_URL is compromised or misconfigured.

**Current Code:**
```typescript
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
```

**Recommendation:** Validate the frontend URL against an allowlist, or use a fixed production URL.

---

## Security Best Practices Already Implemented

The codebase already follows several good security practices:

1. **Helmet Middleware** - Security headers configured (`apps/api/src/main.ts:11`)
2. **ValidationPipe with Whitelist** - Rejects unknown properties (`apps/api/src/main.ts:27-36`)
3. **Rate Limiting** - 100 requests per 60 seconds (`apps/api/src/app.module.ts:45-50`)
4. **Parameterized Queries** - TypeORM prevents SQL injection
5. **bcrypt Password Hashing** - 12 rounds (`apps/api/src/modules/auth/auth.service.ts:38`)
6. **UUID Validation** - ParseUUIDPipe on most route parameters
7. **JWT Token Expiration** - Tokens expire (configurable, default 7 days)
8. **Soft Deletes** - Data not permanently deleted
9. **Tenant Isolation** - Most queries filter by tenantId
10. **Swagger Hidden in Production** - API docs only in development

---

## Recommended Fixes Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | Cross-tenant user access | Low | Critical |
| P0 | Encrypt OAuth tokens | Medium | Critical |
| P1 | Fail on missing JWT_SECRET | Low | High |
| P1 | Update npm dependencies | Low | High |
| P1 | Add @Exclude to password | Low | High |
| P2 | Validate merge endpoint body | Low | Medium |
| P2 | DB synchronize opt-in | Low | Medium |
| P3 | OAuth redirect validation | Low | Medium |

---

## Implementation Notes

### Token Encryption Example

```typescript
// packages/database/src/utils/encryption.ts
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, tagHex, dataHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}

// Usage with TypeORM transformer
export const EncryptedColumn = () =>
  Column({
    type: 'text',
    transformer: {
      to: (value: string) => (value ? encrypt(value) : value),
      from: (value: string) => (value ? decrypt(value) : value),
    },
  });
```

---

## Next Steps

1. Fix P0 issues immediately
2. Schedule P1 fixes for next sprint
3. Add P2/P3 to backlog
4. Consider adding automated security scanning (e.g., Snyk, OWASP ZAP)
5. Implement security headers CSP policy
6. Add audit logging for sensitive operations

---

*Report generated: 17 January 2026*
