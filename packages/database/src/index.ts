// Base
export { BaseEntity } from './entities/base.entity';

// Core entities
export { Tenant } from './entities/tenant.entity';
export { User } from './entities/user.entity';
export { UserIntegration } from './entities/user-integration.entity';

// CRM entities
export { Company } from './entities/company.entity';
export { Contact } from './entities/contact.entity';
export { Deal } from './entities/deal.entity';
export { Pipeline } from './entities/pipeline.entity';
export { Stage } from './entities/stage.entity';
export { Activity } from './entities/activity.entity';
export { Task } from './entities/task.entity';

// Integration entities
export { EmailSyncState } from './entities/email-sync-state.entity';
export { SlackInstallation } from './entities/slack-installation.entity';

// Data source for migrations
export { dataSource } from './data-source';

// Utilities
export { encrypt, decrypt, encryptedTransformer, generateEncryptionKey } from './utils/encryption';

// All entities array for TypeORM
export const entities = [
  // Dynamic import to avoid circular dependency issues
];
