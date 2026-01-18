import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import type { PieChartSpec } from '@/types/report';

interface Props {
  spec: PieChartSpec;
}

const COLORS = [
  'var(--accent)',
  'var(--success)',
  'var(--warning)',
  'var(--danger)',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
];

export function PieChartComponent({ spec }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{spec.title}</CardTitle>
      </CardHeader>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={spec.data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ label, percent }) =>
                `${label} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {spec.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--bg-tertiary)',
                borderRadius: '8px',
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
