export type ContactSource =
  | 'manual'
  | 'email_sync'
  | 'calendar_sync'
  | 'whatsapp'
  | 'import'
  | 'api';

export type ActivityType =
  | 'email'
  | 'call'
  | 'meeting'
  | 'note'
  | 'whatsapp'
  | 'sms';

export type ActivityDirection = 'inbound' | 'outbound';

export type DealStatus = 'open' | 'won' | 'lost';

export type TaskStatus = 'pending' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high';

export type UserRole = 'admin' | 'manager' | 'rep';

export type IntegrationProvider = 'google' | 'slack' | 'microsoft';

export interface ContactSummary {
  id: string;
  fullName: string;
  email?: string;
  company?: string;
  lastContactedAt?: Date;
  dealCount: number;
  totalDealValue: number;
}

export interface DealSummary {
  id: string;
  name: string;
  amount?: number;
  currency: string;
  probability: number;
  stageName: string;
  expectedCloseDate?: Date;
  contactName?: string;
  companyName?: string;
}

export interface ActivitySummary {
  id: string;
  type: ActivityType;
  subject: string;
  occurredAt: Date;
  contactName?: string;
  dealName?: string;
}
