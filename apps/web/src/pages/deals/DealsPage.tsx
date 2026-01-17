import { useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePipelines } from '@/hooks/useDeals';
import { KanbanBoard } from '@/components/deals/KanbanBoard';
import { CreateDealDialog } from '@/components/deals/CreateDealDialog';

export function DealsPage() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: pipelines, isLoading: isPipelinesLoading } = usePipelines();

  // Set default pipeline when data loads
  if (pipelines?.length && !selectedPipelineId) {
    const defaultPipeline = pipelines.find((p) => p.isDefault) || pipelines[0];
    if (defaultPipeline) {
      setSelectedPipelineId(defaultPipeline.id);
    }
  }

  const selectedPipeline = pipelines?.find((p) => p.id === selectedPipelineId);

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-cool-dark">Deals</h1>
          <p className="text-sm text-grey">Manage your sales pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Pipeline Selector */}
          {isPipelinesLoading ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines?.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View Toggle */}
          <div className="flex rounded-lg border border-brand-violet-light/50 p-1">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' && selectedPipeline && (
        <KanbanBoard pipeline={selectedPipeline} />
      )}

      {viewMode === 'list' && (
        <div className="flex items-center justify-center flex-1 text-grey">
          List view coming soon
        </div>
      )}

      <CreateDealDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        pipelineId={selectedPipelineId}
        stages={selectedPipeline?.stages ?? []}
      />
    </div>
  );
}
