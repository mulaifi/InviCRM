import { useQuery } from '@tanstack/react-query';
import {
  Users,
  DollarSign,
  Activity,
  CheckSquare,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { dashboardApi } from '@/api/dashboard';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatRelativeTime, getInitials } from '@/lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: briefing, isLoading: isBriefingLoading } = useQuery({
    queryKey: ['dashboard', 'ai-briefing'],
    queryFn: dashboardApi.getAIBriefing,
  });

  const { data: recentActivities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['dashboard', 'recent-activities'],
    queryFn: () => dashboardApi.getRecentActivities(5),
  });

  const { data: upcomingTasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['dashboard', 'upcoming-tasks'],
    queryFn: () => dashboardApi.getUpcomingTasks(5),
  });

  const statCards = [
    {
      title: 'Total Contacts',
      value: stats?.contacts.total ?? 0,
      change: `+${stats?.contacts.addedThisMonth ?? 0} this month`,
      icon: Users,
      color: 'text-cyan',
      bgColor: 'bg-cyan/10',
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(stats?.deals.totalValue ?? 0, 'KWD'),
      change: `${stats?.deals.total ?? 0} active deals`,
      icon: DollarSign,
      color: 'text-green',
      bgColor: 'bg-green/10',
    },
    {
      title: 'Won This Month',
      value: formatCurrency(stats?.deals.wonValueThisMonth ?? 0, 'KWD'),
      change: `${stats?.deals.wonThisMonth ?? 0} deals closed`,
      icon: TrendingUp,
      color: 'text-brand-violet',
      bgColor: 'bg-brand-violet/10',
    },
    {
      title: 'Tasks Due',
      value: (stats?.tasks.overdue ?? 0) + (stats?.tasks.dueToday ?? 0),
      change: `${stats?.tasks.overdue ?? 0} overdue`,
      icon: CheckSquare,
      color: 'text-magenta',
      bgColor: 'bg-magenta/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold text-cool-dark">
          Good morning, {user?.firstName}
        </h1>
        <p className="text-sm text-grey">
          Here's what's happening with your sales today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isStatsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-grey">{stat.title}</p>
                        <p className="mt-1 text-2xl font-semibold text-cool-dark">
                          {stat.value}
                        </p>
                        <p className="mt-1 text-xs text-grey">{stat.change}</p>
                      </div>
                      <div className={`rounded-full p-3 ${stat.bgColor}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Briefing */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <div className="rounded-full bg-brand-violet/10 p-2">
              <Sparkles className="h-5 w-5 text-brand-violet" />
            </div>
            <div>
              <CardTitle className="text-base">AI Daily Briefing</CardTitle>
              <CardDescription>Your personalized insights for today</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isBriefingLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : briefing ? (
              <div className="space-y-4">
                <p className="text-cool-dark">{briefing.summary}</p>
                {briefing.highlights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-grey">Key Highlights</h4>
                    <ul className="space-y-1">
                      {briefing.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-violet" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {briefing.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-grey">Recommended Actions</h4>
                    <ul className="space-y-1">
                      {briefing.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-grey">
                No briefing available. Connect your Gmail and Slack to get personalized insights.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest updates across your CRM</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/activities')}
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isActivitiesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities?.length ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    {activity.contact ? (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(
                            `${activity.contact.firstName} ${activity.contact.lastName}`
                          )}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-violet-light">
                        <Activity className="h-4 w-4 text-brand-violet" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cool-dark truncate">
                        {activity.subject}
                      </p>
                      <p className="text-xs text-grey">
                        {formatRelativeTime(activity.occurredAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-grey">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Upcoming Tasks</CardTitle>
              <CardDescription>Tasks that need your attention</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isTasksLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingTasks?.length ? (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-flash-white"
                  >
                    <CheckSquare className="mt-0.5 h-5 w-5 text-grey" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cool-dark">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-grey">
                        {task.contact && (
                          <span>
                            {task.contact.firstName} {task.contact.lastName}
                          </span>
                        )}
                        {task.deal && (
                          <>
                            {task.contact && <span>•</span>}
                            <span>{task.deal.title}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-grey">
                No upcoming tasks
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
