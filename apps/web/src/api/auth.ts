import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    onboardingCompleted: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  onboardingCompleted: boolean;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post<{ token: string }>('/auth/refresh');
    return response.data;
  },

  // OAuth methods
  getGoogleAuthUrl: async (): Promise<{ url: string }> => {
    const response = await apiClient.get<{ url: string }>('/auth/google');
    return response.data;
  },

  handleGoogleCallback: async (code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/google/callback', { code });
    return response.data;
  },

  getSlackAuthUrl: async (): Promise<{ url: string }> => {
    const response = await apiClient.get<{ url: string }>('/auth/slack');
    return response.data;
  },

  handleSlackCallback: async (code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/slack/callback', { code });
    return response.data;
  },
};
