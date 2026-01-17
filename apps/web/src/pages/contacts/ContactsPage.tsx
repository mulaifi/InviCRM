import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContacts } from '@/hooks/useContacts';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { CreateContactDialog } from '@/components/contacts/CreateContactDialog';

export function ContactsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useContacts({
    page,
    limit: 20,
    search: search || undefined,
  });

  const contacts = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-cool-dark">Contacts</h1>
          <p className="text-sm text-grey">
            {meta?.total ?? 0} contacts in your CRM
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey" />
        <Input
          type="search"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Contacts List */}
      <Card className="divide-y divide-brand-violet-light/30">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-brand-violet-light/30 p-4">
              <Search className="h-8 w-8 text-grey" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-cool-dark">No contacts found</h3>
            <p className="mt-1 text-sm text-grey">
              {search ? 'Try adjusting your search' : 'Add your first contact to get started'}
            </p>
            {!search && (
              <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            )}
          </div>
        ) : (
          contacts.map((contact) => {
            const fullName = `${contact.firstName} ${contact.lastName}`;
            return (
              <button
                key={contact.id}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-flash-white/50"
              >
                <Avatar>
                  <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-cool-dark truncate">
                      {fullName}
                    </span>
                    {contact.company && (
                      <Badge variant="secondary" className="truncate">
                        {contact.company.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {contact.email && (
                      <span className="flex items-center gap-1 text-sm text-grey truncate">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1 text-sm text-grey">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {contact.lastContactedAt && (
                    <span className="text-xs text-grey">
                      Last contact: {formatRelativeTime(contact.lastContactedAt)}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-grey">
            Showing {(meta.page - 1) * meta.limit + 1} to{' '}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CreateContactDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
