import { StepIndicator } from './StepIndicator';
import { GmailStep } from './GmailStep';
import { SlackStep } from './SlackStep';
import { WhatsAppStep } from './WhatsAppStep';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, PartyPopper } from 'lucide-react';
import type { OnboardingStatus } from '@/api/onboarding';

interface OnboardingWizardProps {
  currentStep: number;
  status?: OnboardingStatus;
  onNext: () => void;
  onSkip: (step: string) => void;
  onComplete: () => void;
  isCompleting: boolean;
}

const steps = [
  { id: 'gmail', label: 'Connect Gmail', description: 'Sync emails automatically' },
  { id: 'slack', label: 'Install Slack', description: 'Chat with your CRM' },
  { id: 'whatsapp', label: 'WhatsApp', description: 'Track conversations' },
];

export function OnboardingWizard({
  currentStep,
  status,
  onNext,
  onSkip,
  onComplete,
  isCompleting,
}: OnboardingWizardProps) {
  const isComplete = currentStep >= steps.length;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <GmailStep
            isConnected={status?.steps.gmail ?? false}
            onNext={onNext}
            onSkip={() => onSkip('gmail')}
          />
        );
      case 1:
        return (
          <SlackStep
            isConnected={status?.steps.slack ?? false}
            onNext={onNext}
            onSkip={() => onSkip('slack')}
          />
        );
      case 2:
        return (
          <WhatsAppStep
            isConnected={status?.steps.whatsapp ?? false}
            onNext={onNext}
            onSkip={() => onSkip('whatsapp')}
          />
        );
      default:
        return null;
    }
  };

  if (isComplete) {
    return (
      <Card className="border-0 shadow-elevated">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green/10">
            <PartyPopper className="h-8 w-8 text-green" />
          </div>
          <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
          <CardDescription>
            Your workspace is ready. Start exploring InviCRM and let it work its magic.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {steps.map((step) => {
              const isStepComplete = status?.steps[step.id as keyof typeof status.steps];
              return (
                <div
                  key={step.id}
                  className="flex items-center gap-3 rounded-lg border border-brand-violet-light/50 p-3"
                >
                  <CheckCircle2
                    className={`h-5 w-5 ${isStepComplete ? 'text-green' : 'text-grey'}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-cool-dark">{step.label}</p>
                    <p className="text-xs text-grey">
                      {isStepComplete ? 'Connected' : 'Skipped'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={onComplete} className="w-full" disabled={isCompleting}>
            {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        completedSteps={status?.steps}
      />

      <Card className="border-0 shadow-elevated">
        {renderStepContent()}
      </Card>
    </div>
  );
}
