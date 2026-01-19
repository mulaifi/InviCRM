import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Building2, User } from 'lucide-react';
import { Card, Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Deal } from '@/types';
import { getDealValueAsNumber } from '@/types';

export interface DealCardProps {
  deal: Deal;
  onClick?: () => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}

function formatCurrency(value: number, currency: string = 'KWD'): string {
  return new Intl.NumberFormat('en-KW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function DealCard({
  deal,
  onClick,
  isDragging = false,
  isOverlay = false,
}: DealCardProps) {
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

  const dragging = isDragging || isSortableDragging;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing',
        'hover:border-accent/50 transition-all duration-150',
        dragging && 'opacity-50',
        isOverlay && 'shadow-xl rotate-2 scale-105'
      )}
    >
      {/* Title and value */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-text-primary line-clamp-2">
          {deal.name}
        </h3>
        <span className="text-sm font-semibold text-success whitespace-nowrap">
          {formatCurrency(getDealValueAsNumber(deal), deal.currency)}
        </span>
      </div>

      {/* Contact/Company info */}
      <div className="space-y-1.5 text-xs text-text-secondary">
        {deal.contact && (
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-text-muted" />
            <span className="truncate">
              {deal.contact.firstName} {deal.contact.lastName}
            </span>
          </div>
        )}
        {deal.company && (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3 text-text-muted" />
            <span className="truncate">{deal.company.name}</span>
          </div>
        )}
      </div>

      {/* Footer with date and owner */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-bg-tertiary">
        {deal.expectedCloseDate ? (
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(deal.expectedCloseDate)}</span>
          </div>
        ) : (
          <div />
        )}
        {deal.owner && (
          <Avatar
            firstName={deal.owner.firstName}
            lastName={deal.owner.lastName}
            size="sm"
            className="h-6 w-6 text-[10px]"
          />
        )}
      </div>
    </Card>
  );
}

// Simplified card for drag overlay
export function DealCardOverlay({ deal }: { deal: Deal }) {
  return <DealCard deal={deal} isOverlay />;
}
