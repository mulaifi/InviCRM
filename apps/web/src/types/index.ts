// Core entity types aligned with clik-platform schema

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  settings: Record<string, unknown>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

export interface Customer {
  id: string;
  name: string;
  salesStatus?: string;
}

export interface Contact {
  id: string;
  customerId: string;
  customer?: Customer;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  title: string | null;
  department: string | null;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  notes: string | null;
  dealCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Stage {
  id: string;
  name: string;
  description?: string | null;
  probability: number;
  position: number;
  isClosed: boolean;
  isWon: boolean;
  exitCriteria?: string | null;
  dealCount?: number;
  createdAt?: string;
}

export interface Deal {
  id: string;
  name: string;
  customerId: string;
  customer?: Customer;
  primaryContactId: string | null;
  primaryContact?: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
  } | null;
  stageId: string;
  stage?: Stage;
  ownerId: string | null;
  owner?: User | null;
  teamId: string | null;
  team?: { id: string; name: string } | null;
  value: string | null;
  currency: string;
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  probability: number | null;
  source: string | null;
  temperature: 'cold' | 'warm' | 'hot' | null;
  lossReason: string | null;
  lossNotes: string | null;
  description: string | null;
  requirements: string | null;
  notes: string | null;
  stageChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Legacy type aliases for backward compatibility
export type Company = Customer;

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

// Helper to get deal value as number
export function getDealValueAsNumber(deal: Deal): number {
  if (!deal.value) return 0;
  const parsed = parseFloat(deal.value);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper to check if deal is closed (won or lost)
export function isDealClosed(deal: Deal): boolean {
  return deal.stage?.isClosed ?? false;
}

// Helper to check if deal is won
export function isDealWon(deal: Deal): boolean {
  return deal.stage?.isWon ?? false;
}
