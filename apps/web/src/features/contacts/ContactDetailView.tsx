import { useState } from 'react';
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import { SlideOver, Avatar, Badge, Button, Card, Skeleton } from '@/components/ui';
import { useContact, useDeleteContact } from './useContacts';
import { formatRelativeTime } from '@/lib/utils';
import type { Contact, Activity, Deal } from '@/types';

export interface ContactDetailViewProps {
  contactId: string | null;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
}

const activityIcons: Record<string, typeof Mail> = {
  email: Mail,
  meeting: Calendar,
  call: Phone,
  note: MessageSquare,
  task: Clock,
  slack: MessageSquare,
};

export function ContactDetailView({
  contactId,
  onClose,
  onEdit,
}: ContactDetailViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data, isLoading } = useContact(contactId || undefined);
  const deleteContact = useDeleteContact();

  const contact = data?.data;
  // TODO: Fetch activities and deals from API when endpoints are available
  const activities: Activity[] = [];
  const deals: Deal[] = [];

  const handleDelete = async () => {
    if (!contactId) return;
    try {
      await deleteContact.mutateAsync(contactId);
      onClose();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const footer = contact ? (
    <div className="flex items-center justify-between">
      <Button
        variant="danger"
        size="sm"
        onClick={() => setShowDeleteConfirm(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      <Button onClick={() => onEdit(contact)}>
        <Edit2 className="h-4 w-4" />
        Edit Contact
      </Button>
    </div>
  ) : null;

  return (
    <SlideOver
      isOpen={!!contactId}
      onClose={onClose}
      title={contact ? `${contact.firstName} ${contact.lastName || ''}`.trim() : 'Contact'}
      width="lg"
      footer={footer}
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : contact ? (
        <div className="space-y-6">
          {/* Header with avatar */}
          <div className="flex items-start gap-4">
            <Avatar
              firstName={contact.firstName}
              lastName={contact.lastName || undefined}
              size="lg"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-text-primary">
                {contact.firstName} {contact.lastName}
              </h2>
              {contact.title && (
                <p className="text-sm text-text-secondary">{contact.title}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {contact.isPrimary && (
                  <Badge size="sm" variant="success">Primary</Badge>
                )}
                {contact.isDecisionMaker && (
                  <Badge size="sm" variant="warning">Decision Maker</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Contact info */}
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Contact Information
            </h3>
            <div className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-text-muted" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm text-accent hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-text-muted" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-sm text-text-primary hover:text-accent"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.mobile && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-text-muted" />
                  <a
                    href={`tel:${contact.mobile}`}
                    className="text-sm text-text-primary hover:text-accent"
                  >
                    {contact.mobile} (Mobile)
                  </a>
                </div>
              )}
              {contact.customer && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-primary">
                    {contact.customer.name}
                  </span>
                </div>
              )}
              {contact.department && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">
                    {contact.department}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Related Deals */}
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Related Deals ({contact.dealCount || 0})
            </h3>
            {deals.length > 0 ? (
              <div className="space-y-2">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-bg-primary hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-text-primary">
                        {deal.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {deal.value} {deal.currency}
                      </span>
                      <Badge size="sm" variant="warning">
                        {deal.stage?.name}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No deals yet</p>
            )}
          </Card>

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

          {/* Notes */}
          {contact.notes && (
            <Card>
              <h3 className="text-sm font-medium text-text-secondary mb-2">
                Notes
              </h3>
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {contact.notes}
              </p>
            </Card>
          )}

          {/* Metadata */}
          <div className="text-xs text-text-muted space-y-1">
            <p>Added {formatRelativeTime(contact.createdAt)}</p>
            <p>Last updated {formatRelativeTime(contact.updatedAt)}</p>
          </div>

          {/* Delete confirmation overlay */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <Card className="max-w-sm mx-4">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Delete Contact?
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  This action cannot be undone. This will permanently delete{' '}
                  {contact.firstName} {contact.lastName} and remove all
                  associated data.
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
                    loading={deleteContact.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-text-muted">
          Contact not found
        </div>
      )}
    </SlideOver>
  );
}
