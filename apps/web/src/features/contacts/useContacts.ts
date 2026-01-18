import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, customersApi } from '@/api/contacts';
import type { CreateContactRequest, UpdateContactRequest } from '@/api/contacts';

// Query keys for cache management
export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  list: (params: { search?: string; customerId?: string; page?: number }) =>
    [...contactsKeys.lists(), params] as const,
  details: () => [...contactsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactsKeys.details(), id] as const,
};

export const customersKeys = {
  all: ['customers'] as const,
  lists: () => [...customersKeys.all, 'list'] as const,
  list: (params?: { search?: string; page?: number }) =>
    [...customersKeys.lists(), params] as const,
};

// Legacy alias
export const companiesKeys = customersKeys;

// List contacts with pagination and filters
export function useContactsList(params?: {
  search?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
  // Legacy param name - maps to customerId
  companyId?: string;
  // Legacy param name - maps to pageSize
  limit?: number;
}) {
  const customerId = params?.customerId || params?.companyId;
  const pageSize = params?.pageSize || params?.limit;

  return useQuery({
    queryKey: contactsKeys.list({
      search: params?.search,
      customerId,
      page: params?.page,
    }),
    queryFn: () =>
      contactsApi.list({
        search: params?.search,
        customerId,
        page: params?.page,
        pageSize,
      }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get single contact
export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: contactsKeys.detail(id!),
    queryFn: () => contactsApi.get(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// Create contact mutation
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactRequest) => contactsApi.create(data),
    onSuccess: () => {
      // Invalidate all contact lists to refetch
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
    },
  });
}

// Update contact mutation
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactRequest }) =>
      contactsApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate lists and the specific contact
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: contactsKeys.detail(variables.id),
      });
    },
  });
}

// Delete contact mutation
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
    },
  });
}

// List customers (for select dropdown)
export function useCustomersList(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: customersKeys.list(params),
    queryFn: () => customersApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

// Legacy alias
export const useCompaniesList = useCustomersList;
