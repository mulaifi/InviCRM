import { apiClient, type ApiResponse, type PaginatedResponse } from './client';
import type { Deal, Pipeline, Stage } from '@/types';

export interface CreateDealRequest {
  title: string;
  value: number;
  currency?: string;
  stageId: string;
  pipelineId: string;
  contactId?: string;
  companyId?: string;
  expectedCloseDate?: string;
}

export interface UpdateDealRequest {
  title?: string;
  value?: number;
  stageId?: string;
  contactId?: string;
  companyId?: string;
  expectedCloseDate?: string;
  status?: 'open' | 'won' | 'lost';
}

export const dealsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    pipelineId?: string;
    stageId?: string;
    status?: string;
  }): Promise<PaginatedResponse<Deal>> => {
    const response = await apiClient.get<PaginatedResponse<Deal>>('/deals', {
      params,
    });
    return response.data;
  },

  get: async (id: string): Promise<ApiResponse<Deal>> => {
    const response = await apiClient.get<ApiResponse<Deal>>(`/deals/${id}`);
    return response.data;
  },

  create: async (data: CreateDealRequest): Promise<ApiResponse<Deal>> => {
    const response = await apiClient.post<ApiResponse<Deal>>('/deals', data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateDealRequest
  ): Promise<ApiResponse<Deal>> => {
    const response = await apiClient.patch<ApiResponse<Deal>>(
      `/deals/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/deals/${id}`);
  },

  moveToStage: async (
    id: string,
    stageId: string
  ): Promise<ApiResponse<Deal>> => {
    const response = await apiClient.patch<ApiResponse<Deal>>(
      `/deals/${id}/stage`,
      { stageId }
    );
    return response.data;
  },
};

export const pipelinesApi = {
  list: async (): Promise<ApiResponse<Pipeline[]>> => {
    const response =
      await apiClient.get<ApiResponse<Pipeline[]>>('/pipelines');
    return response.data;
  },

  get: async (id: string): Promise<ApiResponse<Pipeline>> => {
    const response = await apiClient.get<ApiResponse<Pipeline>>(
      `/pipelines/${id}`
    );
    return response.data;
  },

  getStages: async (pipelineId: string): Promise<ApiResponse<Stage[]>> => {
    const response = await apiClient.get<ApiResponse<Stage[]>>(
      `/pipelines/${pipelineId}/stages`
    );
    return response.data;
  },
};
