import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, type ContactsListParams, type CreateContactRequest } from '@/api/contacts';

export function useContacts(params?: ContactsListParams) {
  return useQuery({
    queryKey: ['contacts', 'list', params],
    queryFn: () => contactsApi.list(params),
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contacts', 'detail', id],
    queryFn: () => contactsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactRequest) => contactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', 'list'] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContactRequest> }) =>
      contactsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'detail', id] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', 'list'] });
    },
  });
}
