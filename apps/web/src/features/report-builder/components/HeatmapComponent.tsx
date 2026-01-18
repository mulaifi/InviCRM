import { Card, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { HeatmapSpec } from '@/types/report';

interface Props {
  spec: HeatmapSpec;
}

export function HeatmapComponent({ spec }: Props) {
  // Find min and max values for color scaling
  const values = spec.data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const getIntensity = (value: number): number => {
    if (maxValue === minValue) return 0.5;
    return (value - minValue) / (maxValue - minValue);
  };

  const getColor = (value: number): string => {
    const intensity = getIntensity(value);
    // Gradient from bg-tertiary to accent
    if (intensity < 0.25) return 'bg-bg-tertiary';
    if (intensity < 0.5) return 'bg-accent/25';
    if (intensity < 0.75) return 'bg-accent/50';
    return 'bg-accent';
  };

  // Create a grid map
  const gridMap = new Map<string, number>();
  spec.data.forEach((d) => {
    gridMap.set(`${d.x}-${d.y}`, d.value);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{spec.title}</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Y axis labels + grid */}
          <div className="flex">
            {/* Empty corner */}
            <div className="w-20" />
            {/* X axis labels */}
            <div className="flex gap-1">
              {spec.xLabels.map((label) => (
                <div
                  key={label}
                  className="w-10 text-center text-xs text-text-secondary"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {spec.yLabels.map((yLabel) => (
            <div key={yLabel} className="flex items-center gap-1 mt-1">
              <div className="w-20 text-right pr-2 text-xs text-text-secondary truncate">
                {yLabel}
              </div>
              <div className="flex gap-1">
                {spec.xLabels.map((xLabel) => {
                  const value = gridMap.get(`${xLabel}-${yLabel}`) || 0;
                  return (
                    <div
                      key={`${xLabel}-${yLabel}`}
                      className={cn(
                        'w-10 h-10 rounded flex items-center justify-center text-xs transition-colors',
                        getColor(value),
                        value > (maxValue - minValue) * 0.5 + minValue
                          ? 'text-white'
                          : 'text-text-secondary'
                      )}
                      title={`${xLabel} - ${yLabel}: ${value}`}
                    >
                      {value}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
