// Report Builder types

export type ReportComponentType =
  | 'metric_card'
  | 'bar_chart'
  | 'pie_chart'
  | 'trend_line'
  | 'table'
  | 'list'
  | 'heatmap'
  | 'funnel';

export interface MetricCardSpec {
  type: 'metric_card';
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  format?: 'number' | 'currency' | 'percent';
}

export interface BarChartSpec {
  type: 'bar_chart';
  title: string;
  data: Array<{ label: string; value: number }>;
  orientation?: 'vertical' | 'horizontal';
  color?: string;
}

export interface PieChartSpec {
  type: 'pie_chart';
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
}

export interface TrendLineSpec {
  type: 'trend_line';
  title: string;
  data: Array<{ date: string; value: number }>;
  color?: string;
}

export interface TableSpec {
  type: 'table';
  title: string;
  columns: Array<{ key: string; label: string; format?: string }>;
  rows: Array<Record<string, unknown>>;
}

export interface ListSpec {
  type: 'list';
  title: string;
  items: Array<{
    id: string;
    primary: string;
    secondary?: string;
    value?: string | number;
    badge?: string;
  }>;
}

export interface HeatmapSpec {
  type: 'heatmap';
  title: string;
  data: Array<{ x: string; y: string; value: number }>;
  xLabels: string[];
  yLabels: string[];
}

export interface FunnelSpec {
  type: 'funnel';
  title: string;
  stages: Array<{ name: string; value: number; color?: string }>;
}

export type ReportComponent =
  | MetricCardSpec
  | BarChartSpec
  | PieChartSpec
  | TrendLineSpec
  | TableSpec
  | ListSpec
  | HeatmapSpec
  | FunnelSpec;

export interface ReportSpec {
  id: string;
  title: string;
  description?: string;
  layout: 'grid' | 'stack';
  components: ReportComponent[];
  generatedAt: string;
}
