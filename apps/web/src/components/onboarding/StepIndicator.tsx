import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: Record<string, boolean>;
}

export function StepIndicator({ steps, currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => {
        const isComplete = completedSteps?.[step.id] ?? false;
        const isCurrent = index === currentStep;
        const isPast = index < currentStep;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  isComplete || isPast
                    ? 'border-brand-violet bg-brand-violet text-white'
                    : isCurrent
                      ? 'border-brand-violet bg-white text-brand-violet'
                      : 'border-brand-violet-light bg-white text-grey'
                )}
              >
                {isComplete || isPast ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium',
                  isCurrent ? 'text-brand-violet' : 'text-grey'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-4 h-0.5 w-16 transition-colors',
                  isComplete || isPast ? 'bg-brand-violet' : 'bg-brand-violet-light'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
