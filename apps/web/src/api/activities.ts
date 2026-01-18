import { apiClient, type ApiResponse, type PaginatedResponse } from './client';
import type { Activity, Task } from '@/types';

export interface CreateActivityRequest {
  type: Activity['type'];
  subject: string;
  body?: string;
  contactId?: string;
  dealId?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

export const activitiesApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    contactId?: string;
    dealId?: string;
    type?: string;
  }): Promise<PaginatedResponse<Activity>> => {
    const response = await apiClient.get<PaginatedResponse<Activity>>(
      '/activities',
      { params }
    );
    return response.data;
  },

  get: async (id: string): Promise<ApiResponse<Activity>> => {
    const response = await apiClient.get<ApiResponse<Activity>>(
      `/activities/${id}`
    );
    return response.data;
  },

  create: async (
    data: CreateActivityRequest
  ): Promise<ApiResponse<Activity>> => {
    const response = await apiClient.post<ApiResponse<Activity>>(
      '/activities',
      data
    );
    return response.data;
  },

  getRecent: async (limit?: number): Promise<ApiResponse<Activity[]>> => {
    const response = await apiClient.get<ApiResponse<Activity[]>>(
      '/activities/recent',
      { params: { limit } }
    );
    return response.data;
  },
};

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: Task['priority'];
  contactId?: string;
  dealId?: string;
  assignedToId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: Task['priority'];
  status?: Task['status'];
}

export const tasksApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    assignedToId?: string;
  }): Promise<PaginatedResponse<Task>> => {
    const response = await apiClient.get<PaginatedResponse<Task>>('/tasks', {
      params,
    });
    return response.data;
  },

  get: async (id: string): Promise<ApiResponse<Task>> => {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskRequest): Promise<ApiResponse<Task>> => {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateTaskRequest
  ): Promise<ApiResponse<Task>> => {
    const response = await apiClient.patch<ApiResponse<Task>>(
      `/tasks/${id}`,
      data
    );
    return response.data;
  },

  complete: async (id: string): Promise<ApiResponse<Task>> => {
    const response = await apiClient.patch<ApiResponse<Task>>(
      `/tasks/${id}/complete`
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};
