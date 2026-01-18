import axios from 'axios';

// clik-platform CRM API uses /api/ base path and NextAuth session cookies
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Include cookies for NextAuth session authentication
  withCredentials: true,
});

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to clik-platform login page
      // After login, user will be redirected back
      const currentUrl = encodeURIComponent(window.location.href);
      window.location.href = `/crm/api/auth/signin?callbackUrl=${currentUrl}`;
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
