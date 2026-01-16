import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 50, unique: true })
  slug: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, unknown>;

  @Column({ name: 'subscription_tier', length: 20, default: 'free' })
  subscriptionTier: string;

  @Column({ name: 'subscription_expires_at', type: 'timestamp', nullable: true })
  subscriptionExpiresAt: Date | null;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}
