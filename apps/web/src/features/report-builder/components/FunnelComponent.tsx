import { Card, CardHeader, CardTitle } from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import type { FunnelSpec } from '@/types/report';

interface Props {
  spec: FunnelSpec;
}

const COLORS = [
  'var(--accent)',
  '#818CF8',
  '#A78BFA',
  '#C4B5FD',
  '#DDD6FE',
];

export function FunnelComponent({ spec }: Props) {
  const maxValue = Math.max(...spec.stages.map((s) => s.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{spec.title}</CardTitle>
      </CardHeader>
      <div className="space-y-3">
        {spec.stages.map((stage, index) => {
          const widthPercent = (stage.value / maxValue) * 100;
          const prevStage = index > 0 ? spec.stages[index - 1] : null;
          const conversionRate = prevStage
            ? ((stage.value / prevStage.value) * 100).toFixed(0)
            : null;

          return (
            <div key={stage.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-primary font-medium">
                  {stage.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-primary">
                    {formatNumber(stage.value)}
                  </span>
                  {conversionRate && (
                    <span className="text-xs text-text-secondary">
                      ({conversionRate}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="h-8 bg-bg-tertiary rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: stage.color || COLORS[index % COLORS.length],
                  }}
                >
                  {widthPercent > 30 && (
                    <span className="text-xs text-white font-medium">
                      {widthPercent.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
