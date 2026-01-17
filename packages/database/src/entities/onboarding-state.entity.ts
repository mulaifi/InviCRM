import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

export enum OnboardingStep {
  GMAIL = 'gmail',
  CALENDAR = 'calendar',
  SLACK = 'slack',
  WHATSAPP = 'whatsapp',
  COMPLETE = 'complete',
}

@Entity('onboarding_states')
@Index(['tenantId', 'userId'], { unique: true })
export class OnboardingState extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'current_step',
    type: 'enum',
    enum: OnboardingStep,
    default: OnboardingStep.GMAIL,
  })
  currentStep: OnboardingStep;

  @Column({ name: 'gmail_connected', default: false })
  gmailConnected: boolean;

  @Column({ name: 'calendar_connected', default: false })
  calendarConnected: boolean;

  @Column({ name: 'slack_connected', default: false })
  slackConnected: boolean;

  @Column({ name: 'whatsapp_prompted', default: false })
  whatsappPrompted: boolean;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'skipped_at', type: 'timestamp', nullable: true })
  skippedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;
}
