import { Card, CardHeader, CardTitle } from '@/components/ui';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { TableSpec } from '@/types/report';

interface Props {
  spec: TableSpec;
}

export function TableComponent({ spec }: Props) {
  const formatValue = (value: unknown, format?: string): string => {
    if (value === null || value === undefined) return '-';

    if (typeof value === 'number') {
      switch (format) {
        case 'currency':
          return formatCurrency(value);
        case 'percent':
          return formatPercent(value);
        default:
          return value.toLocaleString();
      }
    }

    return String(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{spec.title}</CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bg-tertiary">
              {spec.columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left py-3 px-4 text-sm font-medium text-text-secondary"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-bg-tertiary/50 hover:bg-bg-primary transition-colors"
              >
                {spec.columns.map((col) => (
                  <td key={col.key} className="py-3 px-4 text-sm text-text-primary">
                    {formatValue(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
