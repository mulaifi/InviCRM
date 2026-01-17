import { apiClient } from './client';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company: {
    id: string;
    name: string;
  } | null;
  source: string;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactDetail extends Contact {
  notes: string | null;
  linkedInUrl: string | null;
  activities: Activity[];
  deals: DealSummary[];
}

export interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  subject: string;
  description: string | null;
  occurredAt: string;
  direction: 'inbound' | 'outbound' | null;
}

export interface DealSummary {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
}

export interface ContactsListParams {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  companyId?: string;
  notes?: string;
  linkedInUrl?: string;
}

export const contactsApi = {
  list: async (params?: ContactsListParams): Promise<PaginatedResponse<Contact>> => {
    const response = await apiClient.get<PaginatedResponse<Contact>>('/contacts', { params });
    return response.data;
  },

  get: async (id: string): Promise<ContactDetail> => {
    const response = await apiClient.get<ContactDetail>(`/contacts/${id}`);
    return response.data;
  },

  create: async (data: CreateContactRequest): Promise<Contact> => {
    const response = await apiClient.post<Contact>('/contacts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateContactRequest>): Promise<Contact> => {
    const response = await apiClient.patch<Contact>(`/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },

  getActivities: async (id: string): Promise<Activity[]> => {
    const response = await apiClient.get<Activity[]>(`/contacts/${id}/activities`);
    return response.data;
  },
};
