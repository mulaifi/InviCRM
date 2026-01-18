import { useQuery } from '@tanstack/react-query';
import { Clock, CheckSquare, Calendar, Mail, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Avatar, Skeleton } from '@/components/ui';
import { MetricCard } from '@/components/data-display';
import { dashboardApi } from '@/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { getDealValueAsNumber } from '@/types';

export function NowView() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'now'],
    queryFn: async () => {
      const response = await dashboardApi.getNow();
      return response.data;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return <NowViewSkeleton />;
  }

  if (error || !data) {
    return (
      <NowViewError
        message={error instanceof Error ? error.message : 'Failed to load dashboard data'}
        onRetry={() => refetch()}
      />
    );
  }

  const displayData = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Briefing */}
      <Card variant="glass" className="border-l-4 border-l-accent">
        <p className="text-text-primary">{displayData.briefing}</p>
      </Card>

      {/* Quick metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Urgent Deals"
          value={displayData.urgentDeals.length}
          change={0}
        />
        <MetricCard
          title="Tasks Due"
          value={displayData.pendingTasks.length}
        />
        <MetricCard
          title="Meetings Today"
          value={displayData.todayMeetings.length}
        />
        <MetricCard
          title="New Activities"
          value={displayData.recentActivities.length}
          change={12}
          changeLabel="vs yesterday"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Urgent Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {displayData.urgentDeals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    firstName={deal.primaryContact?.firstName || 'U'}
                    lastName={deal.primaryContact?.lastName || undefined}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {deal.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {deal.primaryContact?.firstName} {deal.primaryContact?.lastName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">
                    {formatCurrency(getDealValueAsNumber(deal), deal.currency)}
                  </p>
                  <Badge size="sm" variant="warning">
                    {deal.stage?.name}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {/* Tasks */}
            {displayData.pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-bg-primary"
              >
                <CheckSquare className="h-4 w-4 text-text-muted" />
                <div className="flex-1">
                  <p className="text-sm text-text-primary">{task.title}</p>
                </div>
                <Badge
                  size="sm"
                  variant={task.priority === 'high' ? 'danger' : 'default'}
                >
                  {task.priority}
                </Badge>
              </div>
            ))}

            {/* Meetings */}
            {displayData.todayMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-bg-primary"
              >
                <Calendar className="h-4 w-4 text-accent" />
                <div className="flex-1">
                  <p className="text-sm text-text-primary">{meeting.subject}</p>
                </div>
                <span className="text-xs text-text-secondary">
                  {new Date(meeting.occurredAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-text-secondary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {displayData.recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-bg-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  firstName={activity.contact?.firstName || 'U'}
                  lastName={activity.contact?.lastName || undefined}
                  size="sm"
                />
                <div>
                  <p className="text-sm text-text-primary">{activity.subject}</p>
                  <p className="text-xs text-text-secondary">
                    {activity.contact?.firstName} {activity.contact?.lastName}
                  </p>
                </div>
              </div>
              <span className="text-xs text-text-muted">
                {formatRelativeTime(activity.occurredAt)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NowViewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

function NowViewError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <AlertCircle className="h-12 w-12 text-text-muted" />
      <div className="text-center">
        <h3 className="text-lg font-medium text-text-primary mb-1">Unable to load dashboard</h3>
        <p className="text-sm text-text-secondary max-w-md">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
