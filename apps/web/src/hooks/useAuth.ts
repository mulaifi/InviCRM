import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authApi, type LoginRequest, type RegisterRequest } from '@/api';

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    tenant,
    isAuthenticated,
    isLoading,
    setAuth,
    setLoading,
    logout: storeLogout,
  } = useAuthStore();

  // Check auth status on mount
  const { refetch: checkAuth } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await authApi.me();
      return response.data;
    },
    enabled: isAuthenticated && !user,
    retry: false,
  });

  useEffect(() => {
    if (isAuthenticated && !user) {
      checkAuth();
    }
    setLoading(false);
  }, [isAuthenticated, user, checkAuth, setLoading]);

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      setAuth(response.data);
      navigate('/');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      setAuth(response.data);
      navigate('/');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      storeLogout();
      navigate('/login');
    },
    onError: () => {
      // Still logout locally even if API fails
      storeLogout();
      navigate('/login');
    },
  });

  return {
    user,
    tenant,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
