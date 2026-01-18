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

export const aiApi = {
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
