import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useKanbanDeals, useUpdateDealStage } from '@/hooks/useDeals';
import type { Pipeline, Deal } from '@/api/deals';
import { KanbanColumn } from './KanbanColumn';
import { DealCard } from './DealCard';
import { Skeleton } from '@/components/ui/skeleton';

interface KanbanBoardProps {
  pipeline: Pipeline;
}

export function KanbanBoard({ pipeline }: KanbanBoardProps) {
  const { data: dealsByStage, isLoading } = useKanbanDeals(pipeline.id);
  const updateStageMutation = useUpdateDealStage();
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    // Find the deal being dragged
    for (const deals of Object.values(dealsByStage || {})) {
      const deal = deals.find((d) => d.id === activeId);
      if (deal) {
        setActiveDeal(deal);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStageId = over.id as string;

    // Find the deal's current stage
    let currentStageId: string | null = null;
    for (const [stageId, deals] of Object.entries(dealsByStage || {})) {
      if (deals.some((d) => d.id === dealId)) {
        currentStageId = stageId;
        break;
      }
    }

    // Only update if stage changed
    if (currentStageId && currentStageId !== newStageId) {
      updateStageMutation.mutate({
        id: dealId,
        data: { stageId: newStageId },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipeline.stages.map((stage) => (
          <div key={stage.id} className="w-72 shrink-0 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {pipeline.stages
          .sort((a, b) => a.order - b.order)
          .map((stage) => {
            const deals = dealsByStage?.[stage.id] ?? [];
            const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={deals}
                totalValue={totalValue}
              />
            );
          })}
      </div>

      <DragOverlay>
        {activeDeal && <DealCard deal={activeDeal} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
