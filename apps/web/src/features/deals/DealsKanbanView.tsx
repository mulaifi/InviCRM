import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Skeleton } from '@/components/ui';
import { KanbanBoard } from './KanbanBoard';
import { PipelineSelector } from './PipelineSelector';
import { DealsEmptyState } from './DealsEmptyState';
import { useDealsList, usePipelines, usePipelineStages, useMoveDealToStage } from './useDeals';
import type { Deal, Stage } from '@/types';
import { getDealValueAsNumber } from '@/types';

export interface DealsKanbanViewProps {
  onSelectDeal: (deal: Deal) => void;
  onCreateDeal: (stageId?: string) => void;
}

export function DealsKanbanView({
  onSelectDeal,
  onCreateDeal,
}: DealsKanbanViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const pipelineIdParam = searchParams.get('pipeline');

  // Fetch pipelines (virtual pipeline containing all stages)
  const { data: pipelinesData, isLoading: pipelinesLoading } = usePipelines();
  const pipelines = pipelinesData?.data || [];

  // Fetch stages directly
  const { data: stagesData, isLoading: stagesLoading } = usePipelineStages();

  // Fetch deals (moved up to allow deriving stages from deals as fallback)
  const { data: dealsData, isLoading: dealsLoading } = useDealsList();
  const deals = dealsData?.data || [];

  // Derive stages from API or from deals as fallback
  const stages: Stage[] = (() => {
    if (stagesData && stagesData.length > 0) {
      return [...stagesData].sort((a, b) => a.position - b.position);
    }
    // Fallback: extract unique stages from deals
    const stageMap = new Map<string, Stage>();
    for (const deal of deals) {
      if (deal.stage && !stageMap.has(deal.stage.id)) {
        stageMap.set(deal.stage.id, deal.stage);
      }
    }
    return Array.from(stageMap.values()).sort((a, b) => a.position - b.position);
  })();

  // Determine selected pipeline (always default for now)
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>(
    pipelineIdParam || 'default'
  );

  // Set default pipeline when pipelines load
  useEffect(() => {
    if (!selectedPipelineId && pipelines.length > 0) {
      const defaultPipeline = pipelines.find((p) => p.isDefault) ?? pipelines[0];
      if (defaultPipeline) {
        setSelectedPipelineId(defaultPipeline.id);
      }
    }
  }, [pipelines, selectedPipelineId]);

  const moveDealToStage = useMoveDealToStage();

  // Handle moving a deal to a new stage
  const handleMoveDeal = useCallback((dealId: string, newStageId: string) => {
    moveDealToStage.mutate({ dealId, stageId: newStageId });
  }, [moveDealToStage]);

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    setSearchParams({ pipeline: pipelineId });
  };

  const isLoading = pipelinesLoading || stagesLoading || dealsLoading;

  // Calculate totals
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, deal) => sum + getDealValueAsNumber(deal), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-text-primary">Pipeline</h1>
            <PipelineSelector
              pipelines={pipelines}
              selectedPipelineId={selectedPipelineId}
              onSelect={handlePipelineChange}
              isLoading={pipelinesLoading}
            />
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {totalDeals} deals · {new Intl.NumberFormat('en-KW', {
              style: 'currency',
              currency: 'KWD',
              minimumFractionDigits: 0,
            }).format(totalValue)} total value
          </p>
        </div>
        <Button onClick={() => onCreateDeal()}>
          <Plus className="h-4 w-4" />
          New Deal
        </Button>
      </div>

      {/* Kanban Board */}
      {isLoading && stages.length === 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          ))}
        </div>
      ) : stages.length === 0 ? (
        <Card variant="glass" className="border-dashed">
          <DealsEmptyState variant="page" onCreateDeal={() => onCreateDeal()} />
        </Card>
      ) : (
        <KanbanBoard
          stages={stages}
          deals={deals}
          isLoading={isLoading}
          onDealClick={onSelectDeal}
          onCreateDeal={onCreateDeal}
          onMoveDeal={handleMoveDeal}
        />
      )}
    </div>
  );
}
