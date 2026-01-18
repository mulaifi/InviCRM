import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi, pipelinesApi, pipelineStagesApi } from '@/api/deals';
import type { CreateDealRequest, UpdateDealRequest } from '@/api/deals';
import type { Deal } from '@/types';

// Query keys for cache management
export const dealsKeys = {
  all: ['deals'] as const,
  lists: () => [...dealsKeys.all, 'list'] as const,
  list: (params: { stageId?: string; customerId?: string; ownerId?: string }) =>
    [...dealsKeys.lists(), params] as const,
  details: () => [...dealsKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealsKeys.details(), id] as const,
};

export const pipelinesKeys = {
  all: ['pipelines'] as const,
  lists: () => [...pipelinesKeys.all, 'list'] as const,
  details: () => [...pipelinesKeys.all, 'detail'] as const,
  detail: (id: string) => [...pipelinesKeys.details(), id] as const,
  stages: () => [...pipelinesKeys.all, 'stages'] as const,
};

// List deals with filters (fetches all deals for kanban view)
export function useDealsList(params?: {
  stageId?: string;
  customerId?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
  // pipelineId is ignored since clik-platform has flat stages
  pipelineId?: string;
}) {
  return useQuery({
    queryKey: dealsKeys.list({
      stageId: params?.stageId,
      customerId: params?.customerId,
      ownerId: params?.ownerId,
    }),
    queryFn: () =>
      dealsApi.list({
        stageId: params?.stageId,
        customerId: params?.customerId,
        ownerId: params?.ownerId,
        page: params?.page,
        pageSize: params?.pageSize,
        all: true, // Fetch all deals for kanban view
      }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get single deal
export function useDeal(id: string | undefined) {
  return useQuery({
    queryKey: dealsKeys.detail(id!),
    queryFn: () => dealsApi.get(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// List all pipelines (returns virtual pipeline with all stages)
export function usePipelines() {
  return useQuery({
    queryKey: pipelinesKeys.lists(),
    queryFn: () => pipelinesApi.list(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Get single pipeline with stages
export function usePipeline(id: string | undefined) {
  return useQuery({
    queryKey: pipelinesKeys.detail(id ?? 'default'),
    queryFn: () => pipelinesApi.get(id ?? 'default'),
    enabled: true, // Always enabled since we have a virtual default pipeline
    staleTime: 1000 * 60 * 10,
  });
}

// Get all pipeline stages directly
export function usePipelineStages() {
  return useQuery({
    queryKey: pipelinesKeys.stages(),
    queryFn: () => pipelineStagesApi.list(),
    staleTime: 1000 * 60 * 10,
  });
}

// Create deal mutation
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDealRequest) => dealsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealsKeys.lists() });
    },
  });
}

// Update deal mutation
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDealRequest }) =>
      dealsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dealsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: dealsKeys.detail(variables.id),
      });
    },
  });
}

// Delete deal mutation
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dealsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealsKeys.lists() });
    },
  });
}

// Move deal to stage mutation with optimistic updates
export function useMoveDealToStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      dealsApi.moveToStage(dealId, stageId),
    onMutate: async ({ dealId, stageId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: dealsKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData<{
        data: Deal[];
        total: number;
        page: number;
        totalPages: number;
      }>({ queryKey: dealsKeys.lists() });

      // Optimistically update all matching queries
      queryClient.setQueriesData<{
        data: Deal[];
        total: number;
        page: number;
        totalPages: number;
      }>({ queryKey: dealsKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((deal) =>
            deal.id === dealId ? { ...deal, stageId } : deal
          ),
        };
      });

      // Return context with the snapshot
      return { previousData };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: dealsKeys.lists() });
    },
  });
}
