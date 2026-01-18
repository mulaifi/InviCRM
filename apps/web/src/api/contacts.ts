import { apiClient, type ApiResponse, type PaginatedResponse } from './client';
import type { Contact, Company } from '@/types';

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyId?: string;
  title?: string;
  source?: string;
}

export interface UpdateContactRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyId?: string;
  title?: string;
}

export const contactsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    companyId?: string;
  }): Promise<PaginatedResponse<Contact>> => {
    const response = await apiClient.get<PaginatedResponse<Contact>>(
      '/contacts',
      { params }
    );
    return response.data;
  },

  get: async (id: string): Promise<ApiResponse<Contact>> => {
    const response = await apiClient.get<ApiResponse<Contact>>(
      `/contacts/${id}`
    );
    return response.data;
  },

  create: async (data: CreateContactRequest): Promise<ApiResponse<Contact>> => {
    const response = await apiClient.post<ApiResponse<Contact>>(
      '/contacts',
      data
    );
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateContactRequest
  ): Promise<ApiResponse<Contact>> => {
    const response = await apiClient.patch<ApiResponse<Contact>>(
      `/contacts/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },

  search: async (query: string): Promise<ApiResponse<Contact[]>> => {
    const response = await apiClient.get<ApiResponse<Contact[]>>(
      '/contacts/search',
      { params: { q: query } }
    );
    return response.data;
  },
};

export const companiesApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Company>> => {
    const response = await apiClient.get<PaginatedResponse<Company>>(
      '/companies',
      { params }
    );
    return response.data;
  },

  get: async (id: string): Promise<ApiResponse<Company>> => {
    const response = await apiClient.get<ApiResponse<Company>>(
      `/companies/${id}`
    );
    return response.data;
  },

  create: async (data: {
    name: string;
    domain?: string;
    industry?: string;
  }): Promise<ApiResponse<Company>> => {
    const response = await apiClient.post<ApiResponse<Company>>(
      '/companies',
      data
    );
    return response.data;
  },
};
