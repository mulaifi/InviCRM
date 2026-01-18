import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrendIndicatorProps {
  value: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function TrendIndicator({
  value,
  size = 'md',
  showLabel = true,
  className,
}: TrendIndicatorProps) {
  const Icon = value === 0 ? Minus : value > 0 ? TrendingUp : TrendingDown;

  const color =
    value === 0
      ? 'text-text-muted'
      : value > 0
        ? 'text-success'
        : 'text-danger';

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={cn('flex items-center gap-1', color, className)}>
      <Icon className={iconSize} />
      {showLabel && (
        <span className={textSize}>
          {value > 0 ? '+' : ''}
          {value}%
        </span>
      )}
    </div>
  );
}
