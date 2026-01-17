import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router';
import { User, Building2, Calendar } from 'lucide-react';
import type { Deal } from '@/api/deals';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DealCardProps {
  deal: Deal;
  isDragging?: boolean;
}

export function DealCard({ deal, isDragging }: DealCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && navigate(`/deals/${deal.id}`)}
      className={cn(
        'cursor-pointer rounded-lg border border-brand-violet-light/50 bg-white p-3 shadow-soft transition-shadow hover:shadow-card',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-elevated rotate-2',
        isDragging && 'cursor-grabbing'
      )}
    >
      <div className="space-y-2">
        <h4 className="font-medium text-cool-dark line-clamp-2">{deal.title}</h4>

        <div className="text-lg font-semibold text-brand-violet">
          {formatCurrency(deal.value, deal.currency)}
        </div>

        <div className="space-y-1">
          {deal.contact && (
            <div className="flex items-center gap-2 text-xs text-grey">
              <User className="h-3 w-3" />
              <span className="truncate">
                {deal.contact.firstName} {deal.contact.lastName}
              </span>
            </div>
          )}
          {deal.company && (
            <div className="flex items-center gap-2 text-xs text-grey">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{deal.company.name}</span>
            </div>
          )}
          {deal.expectedCloseDate && (
            <div className="flex items-center gap-2 text-xs text-grey">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(deal.expectedCloseDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
