import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import type { BarChartSpec } from '@/types/report';

interface Props {
  spec: BarChartSpec;
}

export function BarChartComponent({ spec }: Props) {
  const isHorizontal = spec.orientation === 'horizontal';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{spec.title}</CardTitle>
      </CardHeader>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={spec.data}
            layout={isHorizontal ? 'vertical' : 'horizontal'}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-tertiary)" />
            {isHorizontal ? (
              <>
                <XAxis
                  type="number"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--bg-tertiary)' }}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--bg-tertiary)' }}
                  width={100}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--bg-tertiary)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--bg-tertiary)' }}
                />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--bg-tertiary)',
                borderRadius: '8px',
              }}
            />
            <Bar
              dataKey="value"
              fill={spec.color || 'var(--accent)'}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
