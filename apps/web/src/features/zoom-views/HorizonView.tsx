import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, Badge, Skeleton } from '@/components/ui';
import { MetricCard } from '@/components/data-display';
import { dashboardApi } from '@/api';
import { formatCurrency } from '@/lib/utils';
import { getDealValueAsNumber } from '@/types';

export function HorizonView() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'horizon'],
    queryFn: async () => {
      const response = await dashboardApi.getHorizon();
      return response.data;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <HorizonViewSkeleton />;
  }

  if (error || !data) {
    return (
      <HorizonViewError
        message={error instanceof Error ? error.message : 'Failed to load dashboard data'}
        onRetry={() => refetch()}
      />
    );
  }

  const displayData = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Weekly metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="New Deals"
          value={displayData.weeklyMetrics.newDeals}
          change={15}
          changeLabel="vs last week"
        />
        <MetricCard
          title="Won"
          value={displayData.weeklyMetrics.closedWon}
          change={50}
        />
        <MetricCard
          title="Lost"
          value={displayData.weeklyMetrics.closedLost}
          change={-25}
        />
        <MetricCard
          title="Pipeline Value"
          value={displayData.weeklyMetrics.totalValue}
          format="currency"
          change={8}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline by Stage - Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Pipeline by Stage
            </CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData.dealsByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-tertiary)" />
                <XAxis
                  dataKey="stage"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--bg-tertiary)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--bg-tertiary)' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--bg-tertiary)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                />
                <Bar
                  dataKey="value"
                  fill="var(--accent)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-text-secondary" />
              This Week
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {displayData.upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-3 rounded-lg bg-bg-primary"
              >
                <p className="text-sm font-medium text-text-primary">
                  {meeting.subject}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {new Date(meeting.occurredAt).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Deals Closing This Week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            Deals Closing This Week
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bg-tertiary">
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                  Deal
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                  Stage
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                  Value
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                  Expected Close
                </th>
              </tr>
            </thead>
            <tbody>
              {displayData.weeklyDeals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-bg-tertiary/50 hover:bg-bg-primary transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-text-primary">
                      {deal.name}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge size="sm">{deal.stage?.name}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <p className="text-sm font-medium text-text-primary">
                      {formatCurrency(getDealValueAsNumber(deal), deal.currency)}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <p className="text-sm text-text-secondary">
                      {deal.expectedCloseDate
                        ? new Date(deal.expectedCloseDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '-'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function HorizonViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function HorizonViewError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <AlertCircle className="h-12 w-12 text-text-muted" />
      <div className="text-center">
        <h3 className="text-lg font-medium text-text-primary mb-1">Unable to load weekly view</h3>
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
