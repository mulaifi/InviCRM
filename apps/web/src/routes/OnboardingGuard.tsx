import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const location = useLocation();
  const { user } = useAuthStore();

  // If user hasn't completed onboarding and isn't already on the onboarding page
  if (user && !user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
