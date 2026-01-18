import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// InviCRM API uses /api/v1 versioned endpoints with JWT authentication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT auth header
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          useAuthStore.getState().setTokens(accessToken, newRefreshToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch {
          // Refresh failed, logout user
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Generic API response type (single item)
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Paginated response matching clik-platform format
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Helper to transform clik-platform pagination to simpler format
export function transformPagination<T>(response: PaginatedResponse<T>): {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  return {
    data: response.data,
    total: response.pagination.total,
    page: response.pagination.currentPage,
    limit: response.pagination.pageSize,
    totalPages: response.pagination.totalPages,
  };
}
