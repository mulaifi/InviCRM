import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui';
import { cn, formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

export interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  format?: 'number' | 'currency' | 'percent';
  currency?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  format = 'number',
  currency = 'KWD',
  className,
}: MetricCardProps) {
  const formattedValue =
    typeof value === 'string'
      ? value
      : format === 'currency'
        ? formatCurrency(value, currency)
        : format === 'percent'
          ? formatPercent(value)
          : formatNumber(value);

  const TrendIcon =
    change === undefined || change === 0
      ? Minus
      : change > 0
        ? TrendingUp
        : TrendingDown;

  const trendColor =
    change === undefined || change === 0
      ? 'text-text-muted'
      : change > 0
        ? 'text-success'
        : 'text-danger';

  return (
    <Card className={cn('', className)}>
      <p className="text-sm text-text-secondary mb-1">{title}</p>
      <p className="text-2xl font-semibold text-text-primary mb-2">
        {formattedValue}
      </p>
      {change !== undefined && (
        <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span>{change > 0 ? '+' : ''}{change}%</span>
          {changeLabel && (
            <span className="text-text-muted ml-1">{changeLabel}</span>
          )}
        </div>
      )}
    </Card>
  );
}
