import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Contact } from './contact.entity';
import { Deal } from './deal.entity';
import { User } from './user.entity';

@Entity('activities')
export class Activity extends BaseEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 20 })
  type: string; // 'email', 'call', 'meeting', 'note', 'whatsapp', 'sms'

  @Column({ length: 20, nullable: true })
  direction: string; // 'inbound', 'outbound'

  @Column({ length: 500 })
  subject: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Index()
  @Column({ name: 'contact_id', type: 'uuid', nullable: true })
  contactId: string;

  @ManyToOne(() => Contact, (contact) => contact.activities)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @Index()
  @Column({ name: 'deal_id', type: 'uuid', nullable: true })
  dealId: string;

  @ManyToOne(() => Deal, (deal) => deal.activities)
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt: Date;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ name: 'external_id', length: 255, nullable: true })
  externalId: string;

  @Column({ name: 'thread_id', length: 255, nullable: true })
  threadId: string;

  @Column({ length: 50, default: 'manual' })
  source: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;
}
