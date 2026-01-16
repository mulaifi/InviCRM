import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Contact } from './contact.entity';
import { Company } from './company.entity';
import { Pipeline } from './pipeline.entity';
import { Stage } from './stage.entity';
import { User } from './user.entity';
import { Activity } from './activity.entity';

@Entity('deals')
export class Deal extends BaseEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount: number;

  @Column({ length: 3, default: 'KWD' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  probability: number;

  @Column({ name: 'expected_close_date', type: 'date', nullable: true })
  expectedCloseDate: Date;

  @Column({ length: 20, default: 'open' })
  status: string; // 'open', 'won', 'lost'

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ name: 'contact_id', type: 'uuid', nullable: true })
  contactId: string;

  @ManyToOne(() => Contact, (contact) => contact.deals)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.deals)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Index()
  @Column({ name: 'pipeline_id', type: 'uuid' })
  pipelineId: string;

  @ManyToOne(() => Pipeline, (pipeline) => pipeline.deals)
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;

  @Index()
  @Column({ name: 'stage_id', type: 'uuid' })
  stageId: string;

  @ManyToOne(() => Stage, (stage) => stage.deals)
  @JoinColumn({ name: 'stage_id' })
  stage: Stage;

  @Index()
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'lost_reason', length: 500, nullable: true })
  lostReason: string;

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: Record<string, unknown>;

  @OneToMany(() => Activity, (activity) => activity.deal)
  activities: Activity[];
}
