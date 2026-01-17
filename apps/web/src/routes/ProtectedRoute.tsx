import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, token, fetchUser, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token && !isAuthenticated) {
        await fetchUser();
      }
      setIsChecking(false);
    };
    checkAuth();
  }, [token, isAuthenticated, fetchUser]);

  if (isChecking || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-violet border-t-transparent" />
          <p className="text-sm text-grey">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
