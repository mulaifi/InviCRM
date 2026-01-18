import { apiClient, type PaginatedResponse, transformPagination } from './client';
import type { Contact, Customer } from '@/types';

export interface CreateContactRequest {
  customerId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  department?: string;
  isPrimary?: boolean;
  isDecisionMaker?: boolean;
  notes?: string;
}

export interface UpdateContactRequest {
  customerId?: string;
  firstName?: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  title?: string | null;
  department?: string | null;
  isPrimary?: boolean;
  isDecisionMaker?: boolean;
  notes?: string | null;
}

export const contactsApi = {
  list: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    customerId?: string;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Contact>>('/contacts', {
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        customerId: params?.customerId,
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

// Customers API (clik-platform calls companies "customers")
export const customersApi = {
  list: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    size?: string;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Customer>>('/companies', {
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        status: params?.status,
        size: params?.size,
      },
    });
    return transformPagination(response.data);
  },

  get: async (id: string) => {
    const response = await apiClient.get<Customer>(`/companies/${id}`);
    return { data: response.data };
  },

  create: async (data: {
    name: string;
    domain?: string;
    vertical?: string;
    size?: string;
    salesStatus?: string;
    phone?: string;
    website?: string;
    source?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post<Customer>('/companies', data);
    return { data: response.data };
  },

  search: async (query: string) => {
    const response = await apiClient.get<{ data: Customer[] }>('/companies/search', {
      params: { q: query },
    });
    return response.data;
  },
};

// Alias for backward compatibility
export const companiesApi = customersApi;
