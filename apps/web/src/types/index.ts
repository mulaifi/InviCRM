// Core entity types aligned with InviCRM schema

export interface Tenant {
  id: string;
  name: string;
  slug?: string;
  settings: Record<string, unknown>;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  timezone?: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  size?: string;
  city?: string;
  country?: string;
  phone?: string;
  source?: string;
}

export interface Contact {
  id: string;
  companyId: string | null;
  company?: Company;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  source?: string | null;
  confidenceScore?: number | null;
  lastContactedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Stage {
  id: string;
  pipelineId: string;
  name: string;
  position: number;
  probability: number;
  type: string; // 'open', 'won', 'lost'
  color?: string | null;
  isClosed: boolean;
  isWon: boolean;
  createdAt?: string;
}

export interface Deal {
  id: string;
  name: string;
  companyId: string | null;
  company?: Company;
  contactId: string | null;
  contact?: Contact;
  pipelineId: string;
  stageId: string;
  stage?: Stage;
  ownerId: string;
  owner?: User;
  amount: number | null;
  currency: string;
  probability: number;
  expectedCloseDate: string | null;
  status: string; // 'open', 'won', 'lost'
  closedAt: string | null;
  notes: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// Legacy type aliases for backward compatibility
export type Customer = Company;

export interface Pipeline {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Stage[];
}

export interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'slack';
  subject: string;
  body?: string;
  contactId?: string;
  contact?: Contact;
  dealId?: string;
  deal?: Deal;
  userId: string;
  user?: User;
  occurredAt: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  contactId?: string;
  dealId?: string;
  assignedToId: string;
  createdAt: string;
}

// Dashboard types
export interface DashboardNow {
  briefing: string;
  urgentDeals: Deal[];
  pendingTasks: Task[];
  recentActivities: Activity[];
  todayMeetings: Activity[];
}

export interface DashboardHorizon {
  weeklyDeals: Deal[];
  upcomingMeetings: Activity[];
  dealsByStage: Array<{ stage: string; count: number; value: number }>;
  weeklyMetrics: {
    newDeals: number;
    closedWon: number;
    closedLost: number;
    totalValue: number;
  };
}

export interface DashboardLandscape {
  quarterlyForecast: number;
  pipelineHealth: {
    total: number;
    weighted: number;
    averageDealSize: number;
    averageCycleTime: number;
  };
  stageConversion: Array<{
    from: string;
    to: string;
    rate: number;
  }>;
  trends: Array<{
    date: string;
    newDeals: number;
    closedValue: number;
  }>;
}

// Helper to get deal amount as number
export function getDealAmountAsNumber(deal: Deal): number {
  if (deal.amount == null) return 0;
  return typeof deal.amount === 'number' ? deal.amount : parseFloat(deal.amount) || 0;
}

// Legacy alias
export const getDealValueAsNumber = getDealAmountAsNumber;

// Helper to check if deal is closed (won or lost)
export function isDealClosed(deal: Deal): boolean {
  return deal.status === 'won' || deal.status === 'lost' || (deal.stage?.isClosed ?? false);
}

// Helper to check if deal is won
export function isDealWon(deal: Deal): boolean {
  return deal.status === 'won' || (deal.stage?.isWon ?? false);
}
