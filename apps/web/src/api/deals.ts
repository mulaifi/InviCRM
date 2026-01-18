import { apiClient, type PaginatedResponse, transformPagination } from './client';
import type { Deal, Stage } from '@/types';

export interface CreateDealRequest {
  name: string;
  customerId: string;
  stageId: string;
  primaryContactId?: string;
  ownerId?: string;
  teamId?: string;
  value?: string | number;
  currency?: string;
  expectedCloseDate?: string;
  probability?: number;
  source?: string;
  temperature?: 'cold' | 'warm' | 'hot';
  description?: string;
  requirements?: string;
  notes?: string;
}

export interface UpdateDealRequest {
  name?: string;
  customerId?: string;
  stageId?: string;
  primaryContactId?: string | null;
  ownerId?: string | null;
  teamId?: string | null;
  value?: string | number | null;
  currency?: string;
  expectedCloseDate?: string | null;
  actualCloseDate?: string | null;
  probability?: number | null;
  source?: string | null;
  temperature?: 'cold' | 'warm' | 'hot' | null;
  lossReason?: string | null;
  lossNotes?: string | null;
  description?: string | null;
  requirements?: string | null;
  notes?: string | null;
}

export const dealsApi = {
  list: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    customerId?: string;
    stageId?: string;
    ownerId?: string;
    all?: boolean;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Deal>>('/deals', {
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        customerId: params?.customerId,
        stageId: params?.stageId,
        ownerId: params?.ownerId,
        all: params?.all,
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

// Pipeline stages API (clik-platform uses flat stages, not nested in pipelines)
export const pipelineStagesApi = {
  list: async (): Promise<Stage[]> => {
    const response = await apiClient.get<Stage[]>('/pipeline-stages');
    return response.data;
  },

  get: async (id: string): Promise<Stage> => {
    const response = await apiClient.get<Stage>(`/pipeline-stages/${id}`);
    return response.data;
  },
};

// Legacy pipelines API (creates a virtual pipeline from flat stages)
export const pipelinesApi = {
  list: async () => {
    const stages = await pipelineStagesApi.list();
    // Create a virtual "default" pipeline containing all stages
    const pipeline = {
      id: 'default',
      name: 'Sales Pipeline',
      isDefault: true,
      stages: stages.sort((a, b) => a.position - b.position),
    };
    return { data: [pipeline] };
  },

  get: async (_id: string) => {
    // Always return the single virtual pipeline
    const stages = await pipelineStagesApi.list();
    const pipeline = {
      id: 'default',
      name: 'Sales Pipeline',
      isDefault: true,
      stages: stages.sort((a, b) => a.position - b.position),
    };
    return { data: pipeline };
  },

  getStages: async (_pipelineId: string) => {
    const stages = await pipelineStagesApi.list();
    return { data: stages.sort((a, b) => a.position - b.position) };
  },
};
