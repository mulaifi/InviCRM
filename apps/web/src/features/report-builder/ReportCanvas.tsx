import { motion } from 'framer-motion';
import { X, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  MetricCardComponent,
  BarChartComponent,
  PieChartComponent,
  TrendLineComponent,
  TableComponent,
  ListComponent,
  HeatmapComponent,
  FunnelComponent,
} from './components';
import type { ReportSpec, ReportComponent } from '@/types/report';
import { cn } from '@/lib/utils';

interface ReportCanvasProps {
  report: ReportSpec;
  onClose?: () => void;
}

export function ReportCanvas({ report, onClose }: ReportCanvasProps) {
  const renderComponent = (component: ReportComponent, index: number) => {
    const key = `${component.type}-${index}`;

    switch (component.type) {
      case 'metric_card':
        return <MetricCardComponent key={key} spec={component} />;
      case 'bar_chart':
        return <BarChartComponent key={key} spec={component} />;
      case 'pie_chart':
        return <PieChartComponent key={key} spec={component} />;
      case 'trend_line':
        return <TrendLineComponent key={key} spec={component} />;
      case 'table':
        return <TableComponent key={key} spec={component} />;
      case 'list':
        return <ListComponent key={key} spec={component} />;
      case 'heatmap':
        return <HeatmapComponent key={key} spec={component} />;
      case 'funnel':
        return <FunnelComponent key={key} spec={component} />;
      default:
        return null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Group metric cards separately for proper layout
  const metricCards = report.components.filter((c) => c.type === 'metric_card');
  const otherComponents = report.components.filter(
    (c) => c.type !== 'metric_card'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-bg-tertiary">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {report.title}
          </h2>
          {report.description && (
            <p className="text-sm text-text-secondary mt-1">
              {report.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <motion.div
        className="p-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Metric cards row */}
        {metricCards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricCards.map((component, index) => (
              <motion.div key={`metric-${index}`} variants={itemVariants}>
                {renderComponent(component, index)}
              </motion.div>
            ))}
          </div>
        )}

        {/* Other components */}
        <div
          className={cn(
            report.layout === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
              : 'flex flex-col gap-6'
          )}
        >
          {otherComponents.map((component, index) => (
            <motion.div
              key={`comp-${index}`}
              variants={itemVariants}
              className={cn(
                // Make full-width tables and lists span the grid
                (component.type === 'table' || component.type === 'heatmap') &&
                  report.layout === 'grid' &&
                  'md:col-span-2'
              )}
            >
              {renderComponent(component, metricCards.length + index)}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-bg-tertiary text-xs text-text-muted">
        Generated at {new Date(report.generatedAt).toLocaleString()}
      </div>
    </motion.div>
  );
}
