import { apiClient } from './client';

export interface OnboardingStatus {
  steps: {
    gmail: boolean;
    calendar: boolean;
    slack: boolean;
    whatsapp: boolean;
  };
  completed: boolean;
}

export interface IntegrationAuthUrl {
  url: string;
}

export const onboardingApi = {
  getStatus: async (): Promise<OnboardingStatus> => {
    const response = await apiClient.get<OnboardingStatus>('/onboarding/status');
    return response.data;
  },

  getGmailAuthUrl: async (): Promise<IntegrationAuthUrl> => {
    const response = await apiClient.get<IntegrationAuthUrl>('/integrations/gmail/auth-url');
    return response.data;
  },

  getSlackInstallUrl: async (): Promise<IntegrationAuthUrl> => {
    const response = await apiClient.get<IntegrationAuthUrl>('/integrations/slack/install-url');
    return response.data;
  },

  completeStep: async (step: string): Promise<OnboardingStatus> => {
    const response = await apiClient.post<OnboardingStatus>(`/onboarding/complete-step`, { step });
    return response.data;
  },

  skipStep: async (step: string): Promise<OnboardingStatus> => {
    const response = await apiClient.post<OnboardingStatus>(`/onboarding/skip-step`, { step });
    return response.data;
  },

  completeOnboarding: async (): Promise<void> => {
    await apiClient.post('/onboarding/complete');
  },
};
