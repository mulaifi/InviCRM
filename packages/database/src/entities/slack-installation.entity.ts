import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('slack_installations')
export class SlackInstallation extends BaseEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index({ unique: true })
  @Column({ name: 'team_id', length: 50 })
  teamId: string;

  @Column({ name: 'team_name', length: 200 })
  teamName: string;

  @Column({ name: 'bot_user_id', length: 50 })
  botUserId: string;

  @Column({ name: 'bot_access_token', type: 'text' })
  botAccessToken: string;

  @Column({ name: 'installed_by_user_id', type: 'uuid', nullable: true })
  installedByUserId: string;

  @Column({ name: 'installed_at', type: 'timestamp' })
  installedAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  scopes: string[];
}
