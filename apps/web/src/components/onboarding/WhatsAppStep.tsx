import { Phone, CheckCircle2, ExternalLink, Chrome } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WhatsAppStepProps {
  isConnected: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export function WhatsAppStep({ isConnected, onNext, onSkip }: WhatsAppStepProps) {
  if (isConnected) {
    return (
      <>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green/10">
            <CheckCircle2 className="h-8 w-8 text-green" />
          </div>
          <CardTitle>WhatsApp Connected</CardTitle>
          <CardDescription>
            The WhatsApp extension is active. Your conversations will be tracked automatically.
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/10">
          <Phone className="h-8 w-8 text-[#25D366]" />
        </div>
        <CardTitle>WhatsApp Integration</CardTitle>
        <CardDescription>
          Track WhatsApp conversations with our Chrome extension (optional).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-flash-white p-3">
            <Chrome className="mt-0.5 h-5 w-5 text-brand-violet" />
            <div>
              <p className="text-sm font-medium text-cool-dark">Chrome Extension</p>
              <p className="text-xs text-grey">
                Install our extension to capture WhatsApp Web conversations.
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-grey">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green" />
              Auto-log WhatsApp conversations
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green" />
              Match contacts automatically
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green" />
              View conversation history in CRM
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
          <p className="text-sm text-gold">
            <strong>Coming Soon:</strong> The WhatsApp extension is currently in beta.
            You can skip this step and enable it later from Settings.
          </p>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full" disabled>
            <ExternalLink className="mr-2 h-4 w-4" />
            Install Extension (Coming Soon)
          </Button>
          <Button onClick={onSkip} className="w-full">
            Continue without WhatsApp
          </Button>
        </div>
      </CardContent>
    </>
  );
}
