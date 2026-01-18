import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Skeleton } from '@/components/ui';
import { ColumnHeader } from './ColumnHeader';
import { DealCard } from './DealCard';
import { DealsEmptyState } from './DealsEmptyState';
import { cn } from '@/lib/utils';
import type { Stage, Deal } from '@/types';

export interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  isLoading?: boolean;
  onDealClick: (deal: Deal) => void;
  onCreateDeal?: () => void;
}

export function KanbanColumn({
  stage,
  deals,
  isLoading = false,
  onDealClick,
  onCreateDeal,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'column',
      stage,
    },
  });

  const dealIds = deals.map((deal) => deal.id);

  return (
    <div
      className={cn(
        'flex-shrink-0 w-72',
        'bg-bg-secondary/50 rounded-xl p-3',
        'flex flex-col h-full',
        isOver && 'ring-2 ring-accent ring-offset-2 ring-offset-bg-primary'
      )}
    >
      <ColumnHeader stage={stage} deals={deals} />

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[200px] space-y-2 overflow-y-auto scrollbar-subtle',
          'transition-colors duration-200',
          isOver && 'bg-accent/5 rounded-lg'
        )}
      >
        {isLoading ? (
          // Loading skeletons
          <>
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </>
        ) : deals.length === 0 ? (
          <DealsEmptyState
            variant="column"
            stageName={stage.name}
            onCreateDeal={onCreateDeal}
          />
        ) : (
          <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onClick={() => onDealClick(deal)}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
