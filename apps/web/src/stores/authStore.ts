import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi, type User, type LoginRequest, type RegisterRequest, type AuthResponse } from '@/api/auth';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (response: AuthResponse) => void;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setOnboardingCompleted: (completed: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (response: AuthResponse) => {
        set({
          token: response.token,
          user: response.user,
          isAuthenticated: true,
        });
      },

      login: async (data: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(data);
          get().setAuth(response);
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          get().setAuth(response);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true });
        try {
          const user = await authApi.me();
          set({ user, isAuthenticated: true });
        } catch {
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      setOnboardingCompleted: (completed: boolean) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, onboardingCompleted: completed } });
        }
      },
    }),
    {
      name: 'invicrm-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
