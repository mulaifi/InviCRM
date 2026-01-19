import { apiClient, type PaginatedResponse, transformPagination } from './client';
import type { Contact, Company } from '@/types';

export interface CreateContactRequest {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  companyId?: string;
  source?: string;
}

export interface UpdateContactRequest {
  firstName?: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  companyId?: string | null;
  source?: string | null;
}

export const contactsApi = {
  list: async (params?: {
    page?: number;
    pageSize?: number;
    limit?: number;
    search?: string;
    companyId?: string;
    // Legacy param name
    customerId?: string;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Contact>>('/contacts', {
      params: {
        page: params?.page,
        limit: params?.limit || params?.pageSize,
        search: params?.search,
        companyId: params?.companyId || params?.customerId,
      },
    });
    return transformPagination(response.data);
  },

  get: async (id: string) => {
    const response = await apiClient.get<Contact>(`/contacts/${id}`);
    return { data: response.data };
  },

  create: async (data: CreateContactRequest) => {
    const response = await apiClient.post<Contact>('/contacts', data);
    return { data: response.data };
  },

  update: async (id: string, data: UpdateContactRequest) => {
    const response = await apiClient.patch<Contact>(`/contacts/${id}`, data);
    return { data: response.data };
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },
};

// Companies API
export const companiesApi = {
  list: async (params?: {
    page?: number;
    pageSize?: number;
    limit?: number;
    search?: string;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Company>>('/companies', {
      params: {
        page: params?.page,
        limit: params?.limit || params?.pageSize,
        search: params?.search,
      },
    });
    return transformPagination(response.data);
  },

  get: async (id: string) => {
    const response = await apiClient.get<Company>(`/companies/${id}`);
    return { data: response.data };
  },

  create: async (data: {
    name: string;
    domain?: string;
    website?: string;
    industry?: string;
    size?: string;
    city?: string;
    country?: string;
    phone?: string;
    source?: string;
  }) => {
    const response = await apiClient.post<Company>('/companies', data);
    return { data: response.data };
  },
};

// Legacy aliases
export const customersApi = companiesApi;
