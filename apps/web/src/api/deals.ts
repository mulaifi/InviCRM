import { apiClient, type PaginatedResponse, transformPagination } from './client';
import type { Deal, Stage } from '@/types';

export interface CreateDealRequest {
  name: string;
  companyId?: string;
  contactId?: string;
  pipelineId: string;
  stageId: string;
  ownerId?: string;
  amount?: number;
  currency?: string;
  expectedCloseDate?: string;
  probability?: number;
  notes?: string;
}

export interface UpdateDealRequest {
  name?: string;
  companyId?: string | null;
  contactId?: string | null;
  stageId?: string;
  ownerId?: string | null;
  amount?: number | null;
  currency?: string;
  expectedCloseDate?: string | null;
  probability?: number | null;
  status?: string;
  notes?: string | null;
  lostReason?: string | null;
}

export const dealsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    pipelineId?: string;
    stageId?: string;
    ownerId?: string;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Deal>>('/deals', {
      params: {
        page: params?.page,
        limit: params?.limit,
        pipelineId: params?.pipelineId,
        stageId: params?.stageId,
        ownerId: params?.ownerId,
      },
    });
    return transformPagination(response.data);
  },

  get: async (id: string) => {
    const response = await apiClient.get<Deal>(`/deals/${id}`);
    return { data: response.data };
  },

  create: async (data: CreateDealRequest) => {
    const response = await apiClient.post<Deal>('/deals', data);
    return { data: response.data };
  },

  update: async (id: string, data: UpdateDealRequest) => {
    const response = await apiClient.patch<Deal>(`/deals/${id}`, data);
    return { data: response.data };
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/deals/${id}`);
  },

  // Move deal to a new stage (convenience method)
  moveToStage: async (id: string, stageId: string) => {
    const response = await apiClient.patch<Deal>(`/deals/${id}`, { stageId });
    return { data: response.data };
  },
};

// Stages API
export const stagesApi = {
  list: async (pipelineId?: string): Promise<Stage[]> => {
    const response = await apiClient.get<Stage[]>('/stages', {
      params: pipelineId ? { pipelineId } : undefined,
    });
    return response.data;
  },

  get: async (id: string): Promise<Stage> => {
    const response = await apiClient.get<Stage>(`/stages/${id}`);
    return response.data;
  },
};

// Pipelines API
export const pipelinesApi = {
  list: async () => {
    const response = await apiClient.get<Array<{ id: string; name: string; isDefault: boolean; stages: Stage[] }>>('/pipelines');
    return { data: response.data };
  },

  get: async (id: string) => {
    const response = await apiClient.get<{ id: string; name: string; isDefault: boolean; stages: Stage[] }>(`/pipelines/${id}`);
    return { data: response.data };
  },

  getDefault: async () => {
    const response = await apiClient.get<{ id: string; name: string; isDefault: boolean; stages: Stage[] }>('/pipelines/default');
    return { data: response.data };
  },

  getStages: async (pipelineId: string) => {
    const stages = await stagesApi.list(pipelineId);
    return { data: stages };
  },
};

// Legacy alias
export const pipelineStagesApi = stagesApi;
