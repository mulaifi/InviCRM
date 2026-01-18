import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import type { TrendLineSpec } from '@/types/report';

interface Props {
  spec: TrendLineSpec;
}

export function TrendLineComponent({ spec }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{spec.title}</CardTitle>
      </CardHeader>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={spec.data}>
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
              dataKey="value"
              stroke={spec.color || 'var(--accent)'}
              strokeWidth={2}
              dot={{ fill: spec.color || 'var(--accent)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
