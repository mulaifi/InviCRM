import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Card, Pagination, Skeleton } from '@/components/ui';
import { ContactCard } from './ContactCard';
import { ContactsFilters } from './ContactsFilters';
import { ContactsEmptyState } from './ContactsEmptyState';
import { useContactsList } from './useContacts';
import type { Contact } from '@/types';

export interface ContactsListViewProps {
  onSelectContact: (contact: Contact) => void;
  onCreateContact: () => void;
  selectedContactId?: string;
}

const ITEMS_PER_PAGE = 12;

export function ContactsListView({
  onSelectContact,
  onCreateContact,
  selectedContactId,
}: ContactsListViewProps) {
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);

  // Fetch contacts
  const { data, isLoading } = useContactsList({
    search: search || undefined,
    companyId: companyId || undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const contacts = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const hasSearch = !!search || !!companyId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Contacts</h1>
          <p className="text-sm text-text-secondary mt-1">
            {data?.total || 0} contacts
          </p>
        </div>
        <Button onClick={onCreateContact}>
          <Plus className="h-4 w-4" />
          New Contact
        </Button>
      </div>

      {/* Filters */}
      <ContactsFilters
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        companyId={companyId}
        onCompanyChange={(value) => {
          setCompanyId(value);
          setPage(1);
        }}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && contacts.length === 0 && (
        <Card variant="glass" className="border-dashed">
          <ContactsEmptyState
            hasSearch={hasSearch}
            onClearSearch={() => {
              setSearch('');
              setCompanyId('');
            }}
            onCreateContact={onCreateContact}
          />
        </Card>
      )}

      {/* Contacts grid */}
      {!isLoading && contacts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onClick={() => onSelectContact(contact)}
                isSelected={contact.id === selectedContactId}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  );
}
