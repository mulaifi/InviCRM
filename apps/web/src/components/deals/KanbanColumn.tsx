import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Stage, Deal } from '@/api/deals';
import { DealCard } from './DealCard';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  stage: Stage;
  deals: Deal[];
  totalValue: number;
}

export function KanbanColumn({ stage, deals, totalValue }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-medium text-cool-dark">{stage.name}</h3>
          <span className="rounded-full bg-brand-violet-light/50 px-2 py-0.5 text-xs font-medium text-grey">
            {deals.length}
          </span>
        </div>
        <span className="text-xs text-grey">
          {formatCurrency(totalValue, 'KWD')}
        </span>
      </div>

      {/* Column Content */}
      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex flex-1 flex-col gap-2 rounded-lg p-2 transition-colors min-h-[200px]',
            isOver ? 'bg-brand-violet/5' : 'bg-flash-white/50'
          )}
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
          {deals.length === 0 && (
            <div className="flex flex-1 items-center justify-center text-sm text-grey">
              No deals
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
