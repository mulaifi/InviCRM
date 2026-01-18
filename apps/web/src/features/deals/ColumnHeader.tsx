import { cn } from '@/lib/utils';
import type { Stage, Deal } from '@/types';
import { getDealValueAsNumber } from '@/types';

export interface ColumnHeaderProps {
  stage: Stage;
  deals: Deal[];
  currency?: string;
}

function formatCurrency(value: number, currency: string = 'KWD'): string {
  return new Intl.NumberFormat('en-KW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ColumnHeader({ stage, deals, currency = 'KWD' }: ColumnHeaderProps) {
  const totalValue = deals.reduce((sum, deal) => sum + getDealValueAsNumber(deal), 0);
  const dealCount = deals.length;

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-text-primary">{stage.name}</h3>
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            'bg-bg-tertiary text-text-secondary'
          )}
        >
          {dealCount}
        </span>
      </div>
      {totalValue > 0 && (
        <span className="text-xs font-medium text-text-secondary">
          {formatCurrency(totalValue, currency)}
        </span>
      )}
    </div>
  );
}
