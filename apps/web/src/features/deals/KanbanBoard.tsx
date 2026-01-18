import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { DealCardOverlay } from './DealCard';
import type { Stage, Deal } from '@/types';

export interface KanbanBoardProps {
  stages: Stage[];
  deals: Deal[];
  isLoading?: boolean;
  onDealClick: (deal: Deal) => void;
  onCreateDeal?: (stageId?: string) => void;
  onMoveDeal: (dealId: string, stageId: string) => void;
}

export function KanbanBoard({
  stages,
  deals,
  isLoading = false,
  onDealClick,
  onCreateDeal,
  onMoveDeal,
}: KanbanBoardProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  // Configure sensors with distance constraint for click vs drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    stages.forEach((stage) => {
      grouped[stage.id] = deals.filter((deal) => deal.stageId === stage.id);
    });
    return grouped;
  }, [stages, deals]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = deals.find((d) => d.id === active.id);
    if (deal) {
      setActiveDeal(deal);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    // Determine the target stage
    let targetStageId: string | null = null;

    if (over.data.current?.type === 'column') {
      targetStageId = over.id as string;
    } else {
      // Dropped on another deal, find its stage
      const targetDeal = deals.find((d) => d.id === over.id);
      if (targetDeal) {
        targetStageId = targetDeal.stageId;
      }
    }

    // Only move if the stage actually changed
    if (targetStageId && targetStageId !== deal.stageId) {
      onMoveDeal(dealId, targetStageId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-subtle">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage[stage.id] || []}
            isLoading={isLoading}
            onDealClick={onDealClick}
            onCreateDeal={() => onCreateDeal?.(stage.id)}
          />
        ))}
      </div>

      {/* Drag overlay for the active card */}
      <DragOverlay>
        {activeDeal && <DealCardOverlay deal={activeDeal} />}
      </DragOverlay>
    </DndContext>
  );
}
