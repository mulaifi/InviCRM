import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { UserIntegration } from './user-integration.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Index({ unique: true })
  @Column({ length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ length: 255, nullable: true })
  password: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName: string;

  @Column({ length: 20, default: 'rep' })
  role: string;

  @Column({ name: 'google_id', length: 255, nullable: true })
  googleId: string;

  @Column({ length: 50, nullable: true })
  timezone: string;

  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @OneToMany(() => UserIntegration, (integration) => integration.user)
  integrations: UserIntegration[];
}
