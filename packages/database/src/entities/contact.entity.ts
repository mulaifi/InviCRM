import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { Activity } from './activity.entity';
import { Deal } from './deal.entity';

@Entity('contacts')
export class Contact extends BaseEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName: string;

  @Index()
  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  title: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.contacts)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ length: 500, nullable: true })
  linkedin: string;

  @Column({ length: 50, default: 'manual' })
  source: string;

  @Column({ name: 'confidence_score', type: 'float', default: 1.0 })
  confidenceScore: number;

  @Column({ name: 'last_contacted_at', type: 'timestamp', nullable: true })
  lastContactedAt: Date;

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: Record<string, unknown>;

  @OneToMany(() => Activity, (activity) => activity.contact)
  activities: Activity[];

  @OneToMany(() => Deal, (deal) => deal.contact)
  deals: Deal[];
}
