import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, companiesApi } from '@/api/contacts';
import type { CreateContactRequest, UpdateContactRequest } from '@/api/contacts';

// Query keys for cache management
export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  list: (params: { search?: string; companyId?: string; page?: number }) =>
    [...contactsKeys.lists(), params] as const,
  details: () => [...contactsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactsKeys.details(), id] as const,
};

export const companiesKeys = {
  all: ['companies'] as const,
  lists: () => [...companiesKeys.all, 'list'] as const,
  list: (params?: { search?: string; page?: number }) =>
    [...companiesKeys.lists(), params] as const,
};

// List contacts with pagination and filters
export function useContactsList(params: {
  search?: string;
  companyId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: contactsKeys.list(params),
    queryFn: () => contactsApi.list(params),
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

// Search contacts (for autocomplete)
export function useContactSearch(query: string) {
  return useQuery({
    queryKey: [...contactsKeys.all, 'search', query] as const,
    queryFn: () => contactsApi.search(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// List companies (for select dropdown)
export function useCompaniesList(params?: { search?: string; page?: number }) {
  return useQuery({
    queryKey: companiesKeys.list(params),
    queryFn: () => companiesApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}
