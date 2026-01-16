import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Get the encryption key from environment variable.
 * Returns null if not configured (allows graceful degradation in development).
 */
function getEncryptionKey(): Buffer | null {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production');
    }
    return null;
  }

  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }
  return key;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns format: iv:tag:ciphertext (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) {
    // In development without key, store with a marker prefix
    return `unencrypted:${plaintext}`;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt an encrypted string.
 * Handles both encrypted format and unencrypted development data.
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) {
    return encrypted;
  }

  // Handle development unencrypted data
  if (encrypted.startsWith('unencrypted:')) {
    return encrypted.substring(12);
  }

  const key = getEncryptionKey();
  if (!key) {
    // In development without key, try to read as unencrypted
    // This handles legacy data before encryption was added
    if (!encrypted.includes(':')) {
      return encrypted;
    }
    throw new Error('Cannot decrypt data without ENCRYPTION_KEY');
  }

  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    // Legacy unencrypted data - return as-is in development
    if (process.env.NODE_ENV !== 'production') {
      return encrypted;
    }
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(data).toString('utf8') + decipher.final('utf8');
}

/**
 * TypeORM column transformer for encrypted fields.
 * Automatically encrypts on save and decrypts on load.
 */
export const encryptedTransformer = {
  to: (value: string | null | undefined): string | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return encrypt(value);
  },
  from: (value: string | null | undefined): string | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return decrypt(value);
  },
};

/**
 * Generate a new 32-byte encryption key.
 * Use this to create a new ENCRYPTION_KEY value.
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
