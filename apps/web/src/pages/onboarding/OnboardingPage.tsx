import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { onboardingApi } from '@/api/onboarding';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setOnboardingCompleted } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: status, isLoading } = useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: onboardingApi.getStatus,
  });

  const completeMutation = useMutation({
    mutationFn: onboardingApi.completeOnboarding,
    onSuccess: () => {
      setOnboardingCompleted(true);
      navigate('/');
    },
  });

  const skipMutation = useMutation({
    mutationFn: onboardingApi.skipStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });
    },
  });

  useEffect(() => {
    if (status) {
      // Calculate current step based on status
      const steps = ['gmail', 'slack', 'whatsapp'] as const;
      const firstIncomplete = steps.findIndex((step) => !status.steps[step]);
      setCurrentStep(firstIncomplete === -1 ? steps.length : firstIncomplete);
    }
  }, [status]);

  const handleComplete = () => {
    completeMutation.mutate();
  };

  const handleSkip = (step: string) => {
    skipMutation.mutate(step);
    setCurrentStep((prev) => prev + 1);
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-flash-white/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-violet" />
          <p className="text-sm text-grey">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-flash-white/50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-violet">
              <span className="text-lg font-bold text-white">IC</span>
            </div>
            <span className="text-2xl font-semibold text-cool-dark">InviCRM</span>
          </div>
        </div>

        <OnboardingWizard
          currentStep={currentStep}
          status={status}
          onNext={handleNext}
          onSkip={handleSkip}
          onComplete={handleComplete}
          isCompleting={completeMutation.isPending}
        />
      </div>
    </div>
  );
}
