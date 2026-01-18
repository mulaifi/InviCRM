import { Card, CardHeader, CardTitle, Badge } from '@/components/ui';
import type { ListSpec } from '@/types/report';

interface Props {
  spec: ListSpec;
}

export function ListComponent({ spec }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{spec.title}</CardTitle>
      </CardHeader>
      <div className="space-y-2">
        {spec.items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-bg-tertiary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-bg-tertiary text-sm text-text-secondary">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {item.primary}
                </p>
                {item.secondary && (
                  <p className="text-xs text-text-secondary">{item.secondary}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.value !== undefined && (
                <span className="text-sm font-medium text-text-primary">
                  {item.value}
                </span>
              )}
              {item.badge && <Badge size="sm">{item.badge}</Badge>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
