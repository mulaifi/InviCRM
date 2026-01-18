import { useState } from 'react';
import {
  Building2,
  User,
  Calendar,
  TrendingUp,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Thermometer,
} from 'lucide-react';
import { SlideOver, Badge, Button, Card, Skeleton } from '@/components/ui';
import { useDeal, useDeleteDeal } from './useDeals';
import { formatRelativeTime } from '@/lib/utils';
import type { Deal, Activity } from '@/types';
import { getDealValueAsNumber, isDealClosed, isDealWon } from '@/types';

export interface DealDetailViewProps {
  dealId: string | null;
  onClose: () => void;
  onEdit: (deal: Deal) => void;
}

const activityIcons: Record<string, typeof Mail> = {
  email: Mail,
  meeting: Calendar,
  call: Phone,
  note: MessageSquare,
  task: Clock,
  slack: MessageSquare,
};

function formatCurrency(value: number, currency: string = 'KWD'): string {
  return new Intl.NumberFormat('en-KW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getStatusVariant(deal: Deal): 'success' | 'danger' | 'warning' {
  if (isDealWon(deal)) return 'success';
  if (isDealClosed(deal)) return 'danger';
  return 'warning';
}

function getStatusLabel(deal: Deal): string {
  if (isDealWon(deal)) return 'Won';
  if (isDealClosed(deal)) return 'Lost';
  return 'Open';
}

function getTemperatureColor(temp: string | null): string {
  switch (temp) {
    case 'hot':
      return 'text-danger';
    case 'warm':
      return 'text-warning';
    case 'cold':
      return 'text-accent';
    default:
      return 'text-text-muted';
  }
}

export function DealDetailView({
  dealId,
  onClose,
  onEdit,
}: DealDetailViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data, isLoading } = useDeal(dealId || undefined);
  const deleteDeal = useDeleteDeal();

  const deal = data?.data;
  // TODO: Fetch activities from API when endpoint is available
  const activities: Activity[] = [];

  const handleDelete = async () => {
    if (!dealId) return;
    try {
      await deleteDeal.mutateAsync(dealId);
      onClose();
    } catch (error) {
      console.error('Failed to delete deal:', error);
    }
  };

  // Parse owner name for display
  const ownerNameParts = deal?.owner?.name?.split(' ') || [];
  const ownerFirstName = ownerNameParts[0] || '';
  const ownerLastName = ownerNameParts.slice(1).join(' ') || '';

  const footer = deal ? (
    <div className="flex items-center justify-between">
      <Button
        variant="danger"
        size="sm"
        onClick={() => setShowDeleteConfirm(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      <Button onClick={() => onEdit(deal)}>
        <Edit2 className="h-4 w-4" />
        Edit Deal
      </Button>
    </div>
  ) : null;

  return (
    <SlideOver
      isOpen={!!dealId}
      onClose={onClose}
      title={deal?.name || 'Deal'}
      width="lg"
      footer={footer}
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : deal ? (
        <div className="space-y-6">
          {/* Value and Status */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-3xl font-bold text-success">
                {formatCurrency(getDealValueAsNumber(deal), deal.currency)}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Badge size="sm" variant={getStatusVariant(deal)}>
                  {getStatusLabel(deal)}
                </Badge>
                {deal.stage && (
                  <Badge size="sm">{deal.stage.name}</Badge>
                )}
                {deal.temperature && (
                  <span className={`flex items-center gap-1 text-xs ${getTemperatureColor(deal.temperature)}`}>
                    <Thermometer className="h-3 w-3" />
                    {deal.temperature}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-sm text-text-secondary">
              <div className="flex items-center gap-1 justify-end">
                <TrendingUp className="h-4 w-4" />
                <span>{deal.probability ?? 0}% probability</span>
              </div>
            </div>
          </div>

          {/* Key Info */}
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Deal Information
            </h3>
            <div className="space-y-3">
              {deal.primaryContact && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-primary">
                    {deal.primaryContact.firstName} {deal.primaryContact.lastName}
                  </span>
                </div>
              )}
              {deal.customer && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-primary">
                    {deal.customer.name}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-primary">
                  Expected close: {formatDate(deal.expectedCloseDate)}
                </span>
              </div>
              {deal.actualCloseDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-primary">
                    Closed: {formatDate(deal.actualCloseDate)}
                  </span>
                </div>
              )}
              {deal.owner && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">
                    Owner: {ownerFirstName} {ownerLastName}
                  </span>
                </div>
              )}
              {deal.team && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">
                    Team: {deal.team.name}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Description */}
          {deal.description && (
            <Card>
              <h3 className="text-sm font-medium text-text-secondary mb-2">
                Description
              </h3>
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {deal.description}
              </p>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Recent Activity
            </h3>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.type] || MessageSquare;
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <Icon className="h-4 w-4 text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary">
                          {activity.subject}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatRelativeTime(activity.occurredAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No activity yet</p>
            )}
          </Card>

          {/* Metadata */}
          <div className="text-xs text-text-muted space-y-1">
            <p>Created {formatRelativeTime(deal.createdAt)}</p>
            <p>Last updated {formatRelativeTime(deal.updatedAt)}</p>
          </div>

          {/* Delete confirmation overlay */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <Card className="max-w-sm mx-4">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Delete Deal?
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  This action cannot be undone. This will permanently delete the
                  deal "{deal.name}" and remove all associated data.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    loading={deleteDeal.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-text-muted">Deal not found</div>
      )}
    </SlideOver>
  );
}
