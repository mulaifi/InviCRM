import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { encryptedTransformer } from '../utils/encryption';

@Entity('user_integrations')
@Index(['userId', 'provider'], { unique: true })
export class UserIntegration extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.integrations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 50 })
  provider: string; // 'google', 'slack', 'microsoft'

  @Column({ name: 'access_token', type: 'text', nullable: true, transformer: encryptedTransformer })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true, transformer: encryptedTransformer })
  refreshToken: string;

  @Column({ name: 'token_expires_at', type: 'timestamp', nullable: true })
  tokenExpiresAt: Date;

  @Column({ name: 'external_id', length: 255, nullable: true })
  externalId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
