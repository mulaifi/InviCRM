import { MetricCard } from '@/components/data-display';
import type { MetricCardSpec } from '@/types/report';

interface Props {
  spec: MetricCardSpec;
}

export function MetricCardComponent({ spec }: Props) {
  return (
    <MetricCard
      title={spec.title}
      value={spec.value}
      change={spec.change}
      changeLabel={spec.changeLabel}
      format={spec.format}
    />
  );
}
