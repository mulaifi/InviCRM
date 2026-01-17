import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi, type DealsListParams, type CreateDealRequest, type UpdateDealStageRequest } from '@/api/deals';

export function useDeals(params?: DealsListParams) {
  return useQuery({
    queryKey: ['deals', 'list', params],
    queryFn: () => dealsApi.list(params),
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deals', 'detail', id],
    queryFn: () => dealsApi.get(id),
    enabled: !!id,
  });
}

export function usePipelines() {
  return useQuery({
    queryKey: ['pipelines'],
    queryFn: () => dealsApi.getPipelines(),
  });
}

export function usePipeline(id: string) {
  return useQuery({
    queryKey: ['pipelines', id],
    queryFn: () => dealsApi.getPipeline(id),
    enabled: !!id,
  });
}

export function useKanbanDeals(pipelineId: string) {
  return useQuery({
    queryKey: ['deals', 'kanban', pipelineId],
    queryFn: () => dealsApi.getKanbanDeals(pipelineId),
    enabled: !!pipelineId,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDealRequest) => dealsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDealRequest> }) =>
      dealsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', 'detail', id] });
    },
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDealStageRequest }) =>
      dealsApi.updateStage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dealsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}
