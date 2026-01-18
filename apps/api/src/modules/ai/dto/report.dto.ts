// Report spec types (matching frontend)
export interface ReportComponent {
  type: string;
  title: string;
  [key: string]: unknown;
}

export interface ReportSpec {
  id: string;
  title: string;
  description?: string;
  layout: 'grid' | 'stack';
  components: ReportComponent[];
  generatedAt: string;
}
