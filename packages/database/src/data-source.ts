import { DataSource } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';
import { UserIntegration } from './entities/user-integration.entity';
import { Company } from './entities/company.entity';
import { Contact } from './entities/contact.entity';
import { Deal } from './entities/deal.entity';
import { Pipeline } from './entities/pipeline.entity';
import { Stage } from './entities/stage.entity';
import { Activity } from './entities/activity.entity';
import { Task } from './entities/task.entity';
import { EmailSyncState } from './entities/email-sync-state.entity';
import { SlackInstallation } from './entities/slack-installation.entity';
import { OnboardingState } from './entities/onboarding-state.entity';

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433', 10),
  username: process.env.DATABASE_USER || 'invicrm',
  password: process.env.DATABASE_PASSWORD || 'invicrm_dev',
  database: process.env.DATABASE_NAME || 'invicrm',
  entities: [
    Tenant,
    User,
    UserIntegration,
    Company,
    Contact,
    Deal,
    Pipeline,
    Stage,
    Activity,
    Task,
    EmailSyncState,
    SlackInstallation,
    OnboardingState,
  ],
  migrations: [__dirname + '/migrations/*.js'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
