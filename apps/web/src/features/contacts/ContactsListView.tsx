import { useState, useMemo } from 'react';
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

// Mock contacts data for when API is unavailable
const mockContacts: Contact[] = [
  {
    id: '1',
    firstName: 'Ahmed',
    lastName: 'Al-Sabah',
    email: 'ahmed@example.com',
    phone: '+965 9999 1234',
    title: 'CEO',
    source: 'gmail',
    company: { id: '1', name: 'Kuwait Tech', createdAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    firstName: 'Sara',
    lastName: 'Mohammed',
    email: 'sara@example.com',
    phone: '+965 9999 5678',
    title: 'CTO',
    source: 'calendar',
    company: { id: '2', name: 'Digital Solutions', createdAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    firstName: 'Omar',
    lastName: 'Hassan',
    email: 'omar@example.com',
    title: 'Sales Manager',
    source: 'slack',
    company: { id: '1', name: 'Kuwait Tech', createdAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    firstName: 'Fatima',
    lastName: 'Al-Rashid',
    email: 'fatima@example.com',
    phone: '+965 9999 9012',
    title: 'Marketing Director',
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    firstName: 'Khalid',
    lastName: 'Ibrahim',
    email: 'khalid@example.com',
    title: 'Product Manager',
    source: 'whatsapp',
    company: { id: '3', name: 'GCC Enterprises', createdAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    firstName: 'Layla',
    lastName: 'Nasser',
    email: 'layla@example.com',
    phone: '+965 9999 3456',
    title: 'Account Executive',
    source: 'gmail',
    company: { id: '2', name: 'Digital Solutions', createdAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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

  // Use mock data if API is unavailable
  const contacts = data?.data || mockContacts;
  const totalPages = data?.totalPages || 1;

  // Filter and sort mock data locally when API is unavailable
  const filteredContacts = useMemo(() => {
    if (data?.data) return contacts; // Use API response as-is

    let result = [...contacts];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(searchLower) ||
          c.lastName.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.company?.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply company filter
    if (companyId) {
      result = result.filter((c) => c.companyId === companyId || c.company?.id === companyId);
    }

    // Apply sort
    switch (sortBy) {
      case 'name_asc':
        result.sort((a, b) => a.firstName.localeCompare(b.firstName));
        break;
      case 'name_desc':
        result.sort((a, b) => b.firstName.localeCompare(a.firstName));
        break;
      case 'last_contacted':
        result.sort(
          (a, b) =>
            new Date(b.lastContactedAt || 0).getTime() -
            new Date(a.lastContactedAt || 0).getTime()
        );
        break;
      case 'recent':
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return result;
  }, [contacts, search, companyId, sortBy, data?.data]);

  const hasSearch = !!search || !!companyId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Contacts</h1>
          <p className="text-sm text-text-secondary mt-1">
            {data?.total || filteredContacts.length} contacts
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
      {!isLoading && filteredContacts.length === 0 && (
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
      {!isLoading && filteredContacts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onClick={() => onSelectContact(contact)}
                isSelected={contact.id === selectedContactId}
              />
            ))}
          </div>

          {/* Pagination */}
          {(data?.totalPages || 1) > 1 && (
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
