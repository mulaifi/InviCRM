import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiApi } from '@/api';
import { useCommandStore } from '@/stores/commandStore';
import type { ReportSpec } from '@/types/report';

interface UseReportGeneratorResult {
  report: ReportSpec | null;
  isGenerating: boolean;
  error: Error | null;
  generate: (query: string) => Promise<void>;
  clear: () => void;
}

export function useReportGenerator(): UseReportGeneratorResult {
  const [report, setReport] = useState<ReportSpec | null>(null);
  const { setReport: setStoreReport } = useCommandStore();

  const mutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await aiApi.generateReport({ query });
      return response.data;
    },
    onSuccess: (data) => {
      setReport(data);
      setStoreReport(data);
    },
  });

  const generate = useCallback(
    async (query: string) => {
      await mutation.mutateAsync(query);
    },
    [mutation.mutateAsync]
  );

  const clear = useCallback(() => {
    setReport(null);
    setStoreReport(null);
  }, [setStoreReport]);

  return {
    report,
    isGenerating: mutation.isPending,
    error: mutation.error,
    generate,
    clear,
  };
}

// Demo report for testing
export function createDemoReport(query: string): ReportSpec {
  return {
    id: `report-${Date.now()}`,
    title: `Report: ${query}`,
    description: 'AI-generated report based on your query',
    layout: 'grid',
    generatedAt: new Date().toISOString(),
    components: [
      {
        type: 'metric_card',
        title: 'Total Pipeline',
        value: 2850000,
        format: 'currency',
        change: 12,
        changeLabel: 'vs last quarter',
      },
      {
        type: 'metric_card',
        title: 'Win Rate',
        value: 68,
        format: 'percent',
        change: 5,
      },
      {
        type: 'metric_card',
        title: 'Avg Deal Size',
        value: 45000,
        format: 'currency',
        change: -3,
      },
      {
        type: 'metric_card',
        title: 'Active Deals',
        value: 47,
        format: 'number',
      },
      {
        type: 'bar_chart',
        title: 'Pipeline by Stage',
        data: [
          { label: 'Discovery', value: 120000 },
          { label: 'Proposal', value: 180000 },
          { label: 'Negotiation', value: 250000 },
          { label: 'Closing', value: 95000 },
        ],
      },
      {
        type: 'pie_chart',
        title: 'Deal Distribution',
        data: [
          { label: 'Enterprise', value: 45, color: 'var(--accent)' },
          { label: 'Mid-Market', value: 35, color: 'var(--success)' },
          { label: 'SMB', value: 20, color: 'var(--warning)' },
        ],
      },
      {
        type: 'funnel',
        title: 'Conversion Funnel',
        stages: [
          { name: 'Leads', value: 1000 },
          { name: 'Qualified', value: 450 },
          { name: 'Proposal Sent', value: 280 },
          { name: 'Negotiation', value: 155 },
          { name: 'Closed Won', value: 105 },
        ],
      },
      {
        type: 'trend_line',
        title: 'Revenue Trend',
        data: [
          { date: 'Oct', value: 180000 },
          { date: 'Nov', value: 220000 },
          { date: 'Dec', value: 195000 },
          { date: 'Jan', value: 280000 },
        ],
      },
    ],
  };
}
