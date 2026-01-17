import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageSquare, CheckCircle2, Loader2, Bot } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { onboardingApi } from '@/api/onboarding';
import { getErrorMessage } from '@/api/client';

interface SlackStepProps {
  isConnected: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function SlackStep({ isConnected, onNext, onSkip }: SlackStepProps) {
  const [error, setError] = useState<string | null>(null);

  const installMutation = useMutation({
    mutationFn: onboardingApi.getSlackInstallUrl,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  if (isConnected) {
    return (
      <>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green/10">
            <CheckCircle2 className="h-8 w-8 text-green" />
          </div>
          <CardTitle>Slack Connected</CardTitle>
          <CardDescription>
            InviCRM is now available in your Slack workspace. Try typing /crm to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onNext} className="w-full">
            Continue
          </Button>
        </CardContent>
      </>
    );
  }

  return (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#4A154B]/10">
          <MessageSquare className="h-8 w-8 text-[#4A154B]" />
        </div>
        <CardTitle>Install Slack App</CardTitle>
        <CardDescription>
          Chat with your CRM directly in Slack. Get insights, update deals, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-flash-white p-3">
            <Bot className="mt-0.5 h-5 w-5 text-brand-violet" />
            <div>
              <p className="text-sm font-medium text-cool-dark">AI-Powered Assistant</p>
              <p className="text-xs text-grey">
                Ask questions in natural language and get instant answers.
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-grey">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green" />
              Get daily AI briefings on your deals
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green" />
              Update contacts and deals without leaving Slack
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green" />
              Receive real-time notifications
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => installMutation.mutate()}
            className="w-full bg-[#4A154B] hover:bg-[#4A154B]/90"
            disabled={installMutation.isPending}
          >
            {installMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
              </svg>
            )}
            Add to Slack
          </Button>
          <Button variant="ghost" onClick={onSkip} className="w-full">
            Skip for now
          </Button>
        </div>
      </CardContent>
    </>
  );
}
