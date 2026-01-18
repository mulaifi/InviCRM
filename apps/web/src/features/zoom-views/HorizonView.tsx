import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
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
import type { Deal, Activity } from '@/types';
import { getDealValueAsNumber } from '@/types';

export function HorizonView() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'horizon'],
    queryFn: async () => {
      const response = await dashboardApi.getHorizon();
      return response.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <HorizonViewSkeleton />;
  }

  // Mock data - used when API is unavailable
  const mockData = {
    weeklyDeals: [
      { id: '1', name: 'Enterprise Deal', value: '85000', currency: 'KWD', stageId: 'stage-1', stage: { id: 'stage-1', name: 'Negotiation', position: 3, probability: 70, isClosed: false, isWon: false }, customerId: 'cust-1', expectedCloseDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2', name: 'Mid-Market Deal', value: '35000', currency: 'KWD', stageId: 'stage-2', stage: { id: 'stage-2', name: 'Proposal', position: 2, probability: 50, isClosed: false, isWon: false }, customerId: 'cust-2', expectedCloseDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '3', name: 'SMB Deal', value: '12000', currency: 'KWD', stageId: 'stage-3', stage: { id: 'stage-3', name: 'Discovery', position: 1, probability: 30, isClosed: false, isWon: false }, customerId: 'cust-3', expectedCloseDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ] as Deal[],
    upcomingMeetings: [
      { id: '1', type: 'meeting', subject: 'Quarterly Review', occurredAt: new Date(Date.now() + 86400000).toISOString(), userId: 'user-1', createdAt: new Date().toISOString() },
      { id: '2', type: 'meeting', subject: 'Product Demo', occurredAt: new Date(Date.now() + 172800000).toISOString(), userId: 'user-1', createdAt: new Date().toISOString() },
    ] as Activity[],
    dealsByStage: [
      { stage: 'Discovery', count: 8, value: 120000 },
      { stage: 'Proposal', count: 5, value: 180000 },
      { stage: 'Negotiation', count: 3, value: 250000 },
      { stage: 'Closing', count: 2, value: 95000 },
    ],
    weeklyMetrics: {
      newDeals: 5,
      closedWon: 2,
      closedLost: 1,
      totalValue: 645000,
    },
  };

  const displayData = data || mockData;

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
