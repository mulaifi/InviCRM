import { useQuery } from '@tanstack/react-query';
import { Clock, CheckSquare, Calendar, Mail, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Avatar, Skeleton } from '@/components/ui';
import { MetricCard } from '@/components/data-display';
import { dashboardApi } from '@/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { Deal, Task, Activity } from '@/types';
import { getDealValueAsNumber } from '@/types';

export function NowView() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'now'],
    queryFn: async () => {
      const response = await dashboardApi.getNow();
      return response.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return <NowViewSkeleton />;
  }

  // Mock data - used when API is unavailable
  const mockData = {
    briefing: "Good morning! You have 3 deals requiring attention today. Your pipeline value is up 12% from last week.",
    urgentDeals: [
      { id: '1', name: 'Enterprise SaaS Deal', value: '85000', currency: 'KWD', stageId: 'stage-1', stage: { id: 'stage-1', name: 'Negotiation', position: 3, probability: 70, isClosed: false, isWon: false }, customerId: 'cust-1', primaryContact: { id: 'c1', firstName: 'Ahmed', lastName: 'Al-Sabah', email: null }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2', name: 'Cloud Migration Project', value: '42000', currency: 'KWD', stageId: 'stage-2', stage: { id: 'stage-2', name: 'Proposal', position: 2, probability: 50, isClosed: false, isWon: false }, customerId: 'cust-2', primaryContact: { id: 'c2', firstName: 'Sara', lastName: 'Mohammed', email: null }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ] as Deal[],
    pendingTasks: [
      { id: '1', title: 'Follow up with Enterprise client', priority: 'high', dueDate: new Date().toISOString(), status: 'pending', assignedToId: 'user-1', createdAt: new Date().toISOString() },
      { id: '2', title: 'Send proposal to Cloud Migration', priority: 'medium', dueDate: new Date().toISOString(), status: 'pending', assignedToId: 'user-1', createdAt: new Date().toISOString() },
    ] as Task[],
    todayMeetings: [
      { id: '1', type: 'meeting', subject: 'Discovery call with Prospect', occurredAt: new Date().toISOString(), userId: 'user-1', createdAt: new Date().toISOString() },
    ] as Activity[],
    recentActivities: [
      { id: '1', type: 'email', subject: 'RE: Proposal Discussion', occurredAt: new Date(Date.now() - 3600000).toISOString(), userId: 'user-1', createdAt: new Date().toISOString() },
    ] as Activity[],
  };

  const displayData = data || mockData;

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
