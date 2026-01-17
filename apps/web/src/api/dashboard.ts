import { apiClient } from './client';

export interface DashboardStats {
  contacts: {
    total: number;
    addedThisMonth: number;
  };
  deals: {
    total: number;
    totalValue: number;
    wonThisMonth: number;
    wonValueThisMonth: number;
  };
  activities: {
    totalThisWeek: number;
    emailsSent: number;
    meetingsHeld: number;
  };
  tasks: {
    overdue: number;
    dueToday: number;
    upcoming: number;
  };
}

export interface AIBriefing {
  summary: string;
  highlights: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface RecentActivity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'deal_created' | 'deal_won';
  subject: string;
  description: string | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  occurredAt: string;
}

export interface UpcomingTask {
  id: string;
  title: string;
  dueDate: string | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  deal: {
    id: string;
    title: string;
  } | null;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  getAIBriefing: async (): Promise<AIBriefing> => {
    const response = await apiClient.get<AIBriefing>('/dashboard/ai-briefing');
    return response.data;
  },

  getRecentActivities: async (limit?: number): Promise<RecentActivity[]> => {
    const response = await apiClient.get<RecentActivity[]>('/dashboard/recent-activities', {
      params: { limit },
    });
    return response.data;
  },

  getUpcomingTasks: async (limit?: number): Promise<UpcomingTask[]> => {
    const response = await apiClient.get<UpcomingTask[]>('/dashboard/upcoming-tasks', {
      params: { limit },
    });
    return response.data;
  },
};
