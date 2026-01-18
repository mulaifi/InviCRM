import { apiClient, type ApiResponse } from './client';
import type {
  DashboardNow,
  DashboardHorizon,
  DashboardLandscape,
} from '@/types';

export const dashboardApi = {
  getNow: async (): Promise<ApiResponse<DashboardNow>> => {
    const response = await apiClient.get<ApiResponse<DashboardNow>>(
      '/analytics/dashboard-now'
    );
    return response.data;
  },

  getHorizon: async (): Promise<ApiResponse<DashboardHorizon>> => {
    const response = await apiClient.get<ApiResponse<DashboardHorizon>>(
      '/analytics/dashboard-horizon'
    );
    return response.data;
  },

  getLandscape: async (): Promise<ApiResponse<DashboardLandscape>> => {
    const response = await apiClient.get<ApiResponse<DashboardLandscape>>(
      '/analytics/dashboard-landscape'
    );
    return response.data;
  },
};
