import { useQuery } from '@tanstack/react-query';
import { Target, TrendingUp, Layers } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { MetricCard } from '@/components/data-display';
import { dashboardApi } from '@/api';
import { formatCurrency } from '@/lib/utils';

export function LandscapeView() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'landscape'],
    queryFn: async () => {
      const response = await dashboardApi.getLandscape();
      return response.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <LandscapeViewSkeleton />;
  }

  // Mock data - used when API is unavailable
  const mockData = {
    quarterlyForecast: 2850000,
    pipelineHealth: {
      total: 3200000,
      weighted: 1850000,
      averageDealSize: 45000,
      averageCycleTime: 28,
    },
    stageConversion: [
      { from: 'Lead', to: 'Discovery', rate: 45 },
      { from: 'Discovery', to: 'Proposal', rate: 62 },
      { from: 'Proposal', to: 'Negotiation', rate: 55 },
      { from: 'Negotiation', to: 'Closed Won', rate: 68 },
    ],
    trends: [
      { date: 'Oct', newDeals: 12, closedValue: 180000 },
      { date: 'Nov', newDeals: 15, closedValue: 220000 },
      { date: 'Dec', newDeals: 18, closedValue: 195000 },
      { date: 'Jan', newDeals: 22, closedValue: 280000 },
    ],
  };

  const displayData = data || mockData;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quarterly metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Q1 Forecast"
          value={displayData.quarterlyForecast}
          format="currency"
          change={12}
          changeLabel="vs last Q"
        />
        <MetricCard
          title="Pipeline Total"
          value={displayData.pipelineHealth.total}
          format="currency"
        />
        <MetricCard
          title="Weighted Pipeline"
          value={displayData.pipelineHealth.weighted}
          format="currency"
        />
        <MetricCard
          title="Avg Deal Size"
          value={displayData.pipelineHealth.averageDealSize}
          format="currency"
          change={5}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend Line */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-tertiary)" />
                <XAxis
                  dataKey="date"
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
                  formatter={(value: number) => [formatCurrency(value), 'Closed']}
                />
                <Area
                  type="monotone"
                  dataKey="closedValue"
                  stroke="var(--accent)"
                  fill="var(--accent-muted)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Deal Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-text-secondary" />
              New Deals per Month
            </CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-tertiary)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--bg-tertiary)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--bg-tertiary)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--bg-tertiary)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="newDeals"
                  stroke="var(--success)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--success)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-text-secondary" />
            Stage Conversion Rates
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayData.stageConversion.map((conv) => (
            <div
              key={conv.from}
              className="relative p-4 rounded-lg bg-bg-primary"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">{conv.from}</span>
                <span className="text-xs text-text-muted">→</span>
                <span className="text-xs text-text-secondary">{conv.to}</span>
              </div>
              <div className="text-2xl font-semibold text-text-primary">
                {conv.rate}%
              </div>
              {/* Visual bar */}
              <div className="mt-2 h-1 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${conv.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pipeline Health */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Health Score</CardTitle>
          </CardHeader>
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  className="text-bg-tertiary"
                  strokeWidth="12"
                  stroke="currentColor"
                  fill="transparent"
                  r="56"
                  cx="80"
                  cy="80"
                />
                <circle
                  className="text-accent"
                  strokeWidth="12"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="56"
                  cx="80"
                  cy="80"
                  strokeDasharray={`${(78 / 100) * 352} 352`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold text-text-primary">78</span>
                  <span className="text-lg text-text-secondary">/100</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-text-secondary">
            Your pipeline is healthy. Consider adding more deals to Discovery stage.
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-primary">
              <span className="text-sm text-text-secondary">Avg. Sales Cycle</span>
              <span className="text-sm font-medium text-text-primary">
                {displayData.pipelineHealth.averageCycleTime} days
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-primary">
              <span className="text-sm text-text-secondary">Win Rate</span>
              <span className="text-sm font-medium text-success">68%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-primary">
              <span className="text-sm text-text-secondary">Pipeline Coverage</span>
              <span className="text-sm font-medium text-text-primary">3.2x</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-primary">
              <span className="text-sm text-text-secondary">Active Deals</span>
              <span className="text-sm font-medium text-text-primary">47</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function LandscapeViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="h-40" />
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
