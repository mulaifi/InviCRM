import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Contact } from './contact.entity';
import { Deal } from './deal.entity';
import { User } from './user.entity';

@Entity('tasks')
export class Task extends BaseEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 20, default: 'pending' })
  status: string; // 'pending', 'completed', 'cancelled'

  @Column({ length: 20, default: 'medium' })
  priority: string; // 'low', 'medium', 'high'

  @Index()
  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'contact_id', type: 'uuid', nullable: true })
  contactId: string;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @Column({ name: 'deal_id', type: 'uuid', nullable: true })
  dealId: string;

  @ManyToOne(() => Deal)
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;

  @Index()
  @Column({ name: 'assigned_to_id', type: 'uuid' })
  assignedToId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'reminder_at', type: 'timestamp', nullable: true })
  reminderAt: Date;

  @Column({ name: 'slack_message_ts', length: 100, nullable: true })
  slackMessageTs: string;
}
