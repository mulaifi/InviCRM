import { Mail, Phone, Building2 } from 'lucide-react';
import { Card, Avatar, Badge } from '@/components/ui';
import type { Contact } from '@/types';
import { cn } from '@/lib/utils';

export interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
  isSelected?: boolean;
}

export function ContactCard({ contact, onClick, isSelected }: ContactCardProps) {
  return (
    <Card
      hoverable
      onClick={onClick}
      className={cn(
        'cursor-pointer',
        isSelected && 'ring-2 ring-accent border-accent'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar
          firstName={contact.firstName}
          lastName={contact.lastName || undefined}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-text-primary truncate">
              {contact.firstName} {contact.lastName}
            </h3>
            <div className="flex items-center gap-1">
              {contact.isPrimary && (
                <Badge size="sm" variant="success">
                  Primary
                </Badge>
              )}
              {contact.isDecisionMaker && (
                <Badge size="sm" variant="warning">
                  DM
                </Badge>
              )}
            </div>
          </div>

          {contact.title && (
            <p className="text-sm text-text-secondary truncate mt-0.5">
              {contact.title}
            </p>
          )}

          <div className="mt-2 space-y-1">
            {contact.customer && (
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Building2 className="h-3.5 w-3.5" />
                <span className="truncate">{contact.customer.name}</span>
              </div>
            )}

            {contact.email && (
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}

            {contact.phone && (
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Phone className="h-3.5 w-3.5" />
                <span>{contact.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
