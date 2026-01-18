import { apiClient, type ApiResponse } from './client';
import type { ReportSpec } from '@/types/report';
import type { CommandIntent } from '@/types/command';

export interface ClassifyCommandRequest {
  input: string;
}

export interface ClassifyCommandResponse {
  intent: CommandIntent;
  confidence: number;
}

export interface GenerateReportRequest {
  query: string;
  context?: {
    zoomLevel?: string;
    filters?: Record<string, unknown>;
  };
}

// Backend parsed query types
export type QueryIntent =
  | 'contact_lookup'
  | 'company_lookup'
  | 'deal_status'
  | 'deals_list'
  | 'activity_log'
  | 'reminder_create'
  | 'task_create'
  | 'relationship_status'
  | 'pipeline_overview'
  | 'unknown';

export interface ParsedQuery {
  intent: QueryIntent;
  entities: {
    contactName?: string;
    companyName?: string;
    dealName?: string;
    timeframe?: string;
    amount?: number;
    currency?: string;
    dueDate?: string;
    activityType?: string;
  };
  originalText: string;
  confidence: number;
}

// Map backend intent to frontend command intent
function mapParsedQueryToIntent(parsed: ParsedQuery): CommandIntent | null {
  switch (parsed.intent) {
    case 'contact_lookup':
      if (parsed.entities.contactName) {
        return {
          kind: 'action',
          command: { type: 'SEARCH', query: parsed.entities.contactName },
        };
      }
      return { kind: 'view', command: 'VIEW:CONTACTS' };

    case 'company_lookup':
      if (parsed.entities.companyName) {
        return {
          kind: 'action',
          command: { type: 'SEARCH', query: parsed.entities.companyName },
        };
      }
      return { kind: 'view', command: 'VIEW:CONTACTS' };

    case 'deal_status':
    case 'deals_list':
      return { kind: 'view', command: 'VIEW:PIPELINE' };

    case 'pipeline_overview':
      return { kind: 'view', command: 'VIEW:PIPELINE' };

    case 'relationship_status':
      return { kind: 'view', command: 'VIEW:CONTACTS' };

    case 'task_create':
      return { kind: 'action', command: { type: 'CREATE:TASK' } };

    default:
      return null;
  }
}

export const aiApi = {
  parseQuery: async (query: string): Promise<ParsedQuery> => {
    const response = await apiClient.post<ParsedQuery>('/ai/parse', { query });
    return response.data;
  },

  parseAndMapQuery: async (
    query: string
  ): Promise<{ parsed: ParsedQuery; intent: CommandIntent | null }> => {
    const parsed = await aiApi.parseQuery(query);
    const intent = mapParsedQueryToIntent(parsed);
    return { parsed, intent };
  },

  classifyCommand: async (
    input: string
  ): Promise<ApiResponse<ClassifyCommandResponse>> => {
    const response = await apiClient.post<ApiResponse<ClassifyCommandResponse>>(
      '/ai/classify-command',
      { input }
    );
    return response.data;
  },

  generateReport: async (
    data: GenerateReportRequest
  ): Promise<ApiResponse<ReportSpec>> => {
    const response = await apiClient.post<ApiResponse<ReportSpec>>(
      '/ai/generate-report',
      data
    );
    return response.data;
  },
};
