import { Users, Search } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export interface ContactsEmptyStateProps {
  hasSearch: boolean;
  onClearSearch?: () => void;
  onCreateContact?: () => void;
}

export function ContactsEmptyState({
  hasSearch,
  onClearSearch,
  onCreateContact,
}: ContactsEmptyStateProps) {
  if (hasSearch) {
    return (
      <EmptyState
        icon={<Search className="h-12 w-12" />}
        title="No contacts found"
        description="Try adjusting your search or filter criteria to find what you're looking for."
        action={
          onClearSearch
            ? {
                label: 'Clear search',
                onClick: onClearSearch,
                variant: 'secondary',
              }
            : undefined
        }
        className="py-16"
      />
    );
  }

  return (
    <EmptyState
      icon={<Users className="h-12 w-12" />}
      title="No contacts yet"
      description="Start building your network by adding your first contact. Contacts can also be imported automatically from Gmail and Calendar."
      action={
        onCreateContact
          ? {
              label: 'Add Contact',
              onClick: onCreateContact,
            }
          : undefined
      }
      className="py-16"
    />
  );
}
