import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/api/client';
import { formatRelativeTime, getInitials } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  subject: string;
  description: string | null;
  direction: 'inbound' | 'outbound' | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  deal: {
    id: string;
    title: string;
  } | null;
  occurredAt: string;
}

interface ActivitiesResponse {
  data: ActivityItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const activityTypeColors: Record<string, string> = {
  email: 'bg-cyan/10 text-cyan',
  call: 'bg-green/10 text-green',
  meeting: 'bg-brand-violet/10 text-brand-violet',
  note: 'bg-gold/10 text-gold',
  task: 'bg-magenta/10 text-magenta',
};

export function ActivitiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['activities', { page, search, type: typeFilter }],
    queryFn: async () => {
      const response = await apiClient.get<ActivitiesResponse>('/activities', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
        },
      });
      return response.data;
    },
  });

  const activities = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-cool-dark">Activities</h1>
        <p className="text-sm text-grey">
          Track all interactions across your CRM
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey" />
          <Input
            type="search"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="note">Note</SelectItem>
            <SelectItem value="task">Task</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activities List */}
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
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-brand-violet-light/30 p-4">
              <Search className="h-8 w-8 text-grey" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-cool-dark">
              No activities found
            </h3>
            <p className="mt-1 text-sm text-grey">
              {search ? 'Try adjusting your search' : 'Activities will appear here as you use InviCRM'}
            </p>
          </div>
        ) : (
          activities.map((activity) => {
            const contactName = activity.contact
              ? `${activity.contact.firstName} ${activity.contact.lastName}`
              : null;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 transition-colors hover:bg-flash-white/50"
              >
                {activity.contact ? (
                  <Avatar
                    className="cursor-pointer"
                    onClick={() => navigate(`/contacts/${activity.contact!.id}`)}
                  >
                    <AvatarFallback>{getInitials(contactName!)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-violet-light">
                    <span className="text-sm font-medium text-brand-violet">?</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-cool-dark truncate">
                      {activity.subject}
                    </span>
                    <Badge
                      variant="secondary"
                      className={activityTypeColors[activity.type]}
                    >
                      {activity.type}
                    </Badge>
                    {activity.direction && (
                      <span className="text-xs text-grey">
                        ({activity.direction})
                      </span>
                    )}
                  </div>
                  {activity.description && (
                    <p className="mt-1 text-sm text-grey line-clamp-1">
                      {activity.description}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-grey">
                    {contactName && (
                      <button
                        onClick={() => navigate(`/contacts/${activity.contact!.id}`)}
                        className="text-brand-violet hover:underline"
                      >
                        {contactName}
                      </button>
                    )}
                    {activity.deal && (
                      <>
                        {contactName && <span>•</span>}
                        <button
                          onClick={() => navigate(`/deals/${activity.deal!.id}`)}
                          className="text-brand-violet hover:underline"
                        >
                          {activity.deal.title}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-grey whitespace-nowrap">
                  {formatRelativeTime(activity.occurredAt)}
                </span>
              </div>
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
    </div>
  );
}
