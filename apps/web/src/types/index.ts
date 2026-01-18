// Core entity types

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'sales_rep' | 'manager';
  avatarUrl?: string;
  tenantId: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  settings: Record<string, unknown>;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: Company;
  companyId?: string;
  title?: string;
  source?: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  website?: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stageId: string;
  stage?: Stage;
  pipelineId: string;
  pipeline?: Pipeline;
  contact?: Contact;
  contactId?: string;
  company?: Company;
  companyId?: string;
  ownerId: string;
  owner?: User;
  probability: number;
  expectedCloseDate?: string;
  closedAt?: string;
  status: 'open' | 'won' | 'lost';
  createdAt: string;
  updatedAt: string;
}

export interface Pipeline {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Stage[];
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  probability: number;
  pipelineId: string;
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
