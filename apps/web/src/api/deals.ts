import { apiClient } from './client';
import type { PaginatedResponse } from './contacts';

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
  color: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate: string | null;
  stage: Stage;
  pipeline: {
    id: string;
    name: string;
  };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  company: {
    id: string;
    name: string;
  } | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DealDetail extends Deal {
  description: string | null;
  activities: {
    id: string;
    type: string;
    subject: string;
    occurredAt: string;
  }[];
  tasks: {
    id: string;
    title: string;
    dueDate: string | null;
    isCompleted: boolean;
  }[];
}

export interface DealsListParams {
  page?: number;
  limit?: number;
  search?: string;
  pipelineId?: string;
  stageId?: string;
  contactId?: string;
  companyId?: string;
}

export interface CreateDealRequest {
  title: string;
  value: number;
  currency?: string;
  pipelineId: string;
  stageId: string;
  contactId?: string;
  companyId?: string;
  expectedCloseDate?: string;
  description?: string;
}

export interface UpdateDealStageRequest {
  stageId: string;
}

export const dealsApi = {
  list: async (params?: DealsListParams): Promise<PaginatedResponse<Deal>> => {
    const response = await apiClient.get<PaginatedResponse<Deal>>('/deals', { params });
    return response.data;
  },

  get: async (id: string): Promise<DealDetail> => {
    const response = await apiClient.get<DealDetail>(`/deals/${id}`);
    return response.data;
  },

  create: async (data: CreateDealRequest): Promise<Deal> => {
    const response = await apiClient.post<Deal>('/deals', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateDealRequest>): Promise<Deal> => {
    const response = await apiClient.patch<Deal>(`/deals/${id}`, data);
    return response.data;
  },

  updateStage: async (id: string, data: UpdateDealStageRequest): Promise<Deal> => {
    const response = await apiClient.patch<Deal>(`/deals/${id}/stage`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/deals/${id}`);
  },

  // Pipelines
  getPipelines: async (): Promise<Pipeline[]> => {
    const response = await apiClient.get<Pipeline[]>('/pipelines');
    return response.data;
  },

  getPipeline: async (id: string): Promise<Pipeline> => {
    const response = await apiClient.get<Pipeline>(`/pipelines/${id}`);
    return response.data;
  },

  // Kanban view - get deals grouped by stage
  getKanbanDeals: async (pipelineId: string): Promise<Record<string, Deal[]>> => {
    const response = await apiClient.get<Record<string, Deal[]>>(`/deals/kanban/${pipelineId}`);
    return response.data;
  },
};
