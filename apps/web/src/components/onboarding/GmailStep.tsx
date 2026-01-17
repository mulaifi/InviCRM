import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { onboardingApi } from '@/api/onboarding';
import { getErrorMessage } from '@/api/client';

interface GmailStepProps {
  isConnected: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function GmailStep({ isConnected, onNext, onSkip }: GmailStepProps) {
  const [error, setError] = useState<string | null>(null);

  const connectMutation = useMutation({
    mutationFn: onboardingApi.getGmailAuthUrl,
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
          <CardTitle>Gmail Connected</CardTitle>
          <CardDescription>
            Your Gmail account is now connected. We&apos;ll automatically sync your emails.
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-violet/10">
          <Mail className="h-8 w-8 text-brand-violet" />
        </div>
        <CardTitle>Connect Gmail</CardTitle>
        <CardDescription>
          Connect your Gmail account to automatically capture emails and extract contacts.
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
            <Shield className="mt-0.5 h-5 w-5 text-brand-violet" />
            <div>
              <p className="text-sm font-medium text-cool-dark">Secure & Private</p>
              <p className="text-xs text-grey">
                We only read email metadata. Your email content stays private.
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-grey">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green" />
              Auto-capture new contacts from emails
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green" />
              Log email activity on contact timelines
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green" />
              Never miss a follow-up reminder
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => connectMutation.mutate()}
            className="w-full"
            disabled={connectMutation.isPending}
          >
            {connectMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Connect Gmail
          </Button>
          <Button variant="ghost" onClick={onSkip} className="w-full">
            Skip for now
          </Button>
        </div>
      </CardContent>
    </>
  );
}
