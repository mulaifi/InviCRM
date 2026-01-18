import { LayoutGrid, Plus } from 'lucide-react';
import { EmptyState, Button } from '@/components/ui';

export interface DealsEmptyStateProps {
  variant?: 'page' | 'column';
  stageName?: string;
  onCreateDeal?: () => void;
}

export function DealsEmptyState({
  variant = 'page',
  stageName,
  onCreateDeal,
}: DealsEmptyStateProps) {
  if (variant === 'column') {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="text-text-muted mb-2">
          <LayoutGrid className="h-8 w-8 opacity-50" />
        </div>
        <p className="text-xs text-text-muted mb-3">
          No deals in {stageName || 'this stage'}
        </p>
        {onCreateDeal && (
          <Button size="sm" variant="secondary" onClick={onCreateDeal}>
            <Plus className="h-3 w-3" />
            Add Deal
          </Button>
        )}
      </div>
    );
  }

  return (
    <EmptyState
      icon={<LayoutGrid className="h-12 w-12" />}
      title="No deals yet"
      description="Start tracking your sales opportunities by creating your first deal. Deals help you manage your sales pipeline from lead to close."
      action={
        onCreateDeal
          ? {
              label: 'Create Deal',
              onClick: onCreateDeal,
            }
          : undefined
      }
      className="py-16"
    />
  );
}
