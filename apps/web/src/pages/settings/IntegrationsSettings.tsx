import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, MessageSquare, Phone, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/api/client';
import { onboardingApi } from '@/api/onboarding';
import { toast } from '@/hooks/useToast';

interface Integration {
  id: string;
  name: string;
  type: 'gmail' | 'slack' | 'whatsapp';
  isConnected: boolean;
  connectedAt: string | null;
  email?: string;
  workspace?: string;
}

const integrationIcons = {
  gmail: Mail,
  slack: MessageSquare,
  whatsapp: Phone,
};

const integrationColors = {
  gmail: 'bg-red-50 text-red-600',
  slack: 'bg-[#4A154B]/10 text-[#4A154B]',
  whatsapp: 'bg-[#25D366]/10 text-[#25D366]',
};

export function IntegrationsSettings() {
  const queryClient = useQueryClient();

  const { data: integrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await apiClient.get<Integration[]>('/integrations');
      return response.data;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      await apiClient.delete(`/integrations/${integrationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({
        title: 'Integration disconnected',
        description: 'The integration has been disconnected.',
      });
    },
  });

  const handleConnect = async (type: string) => {
    try {
      let url: string;
      switch (type) {
        case 'gmail':
          const gmailResponse = await onboardingApi.getGmailAuthUrl();
          url = gmailResponse.url;
          break;
        case 'slack':
          const slackResponse = await onboardingApi.getSlackInstallUrl();
          url = slackResponse.url;
          break;
        default:
          toast({
            title: 'Coming soon',
            description: 'This integration is not yet available.',
          });
          return;
      }
      window.location.href = url;
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to start connection. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const integrationsList = [
    {
      type: 'gmail' as const,
      name: 'Gmail',
      description: 'Sync emails and automatically capture contacts',
    },
    {
      type: 'slack' as const,
      name: 'Slack',
      description: 'Chat with your CRM and get notifications',
    },
    {
      type: 'whatsapp' as const,
      name: 'WhatsApp',
      description: 'Track WhatsApp conversations (coming soon)',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Connect your tools to automatically sync data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrationsList.map((integration) => {
            const Icon = integrationIcons[integration.type];
            const connected = integrations?.find(
              (i) => i.type === integration.type && i.isConnected
            );

            return (
              <div
                key={integration.type}
                className="flex items-center justify-between rounded-lg border border-brand-violet-light/50 p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`rounded-lg p-3 ${integrationColors[integration.type]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-cool-dark">
                        {integration.name}
                      </h3>
                      {connected ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-grey">
                          <XCircle className="h-3 w-3" />
                          Not connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-grey">{integration.description}</p>
                    {connected?.email && (
                      <p className="text-xs text-grey mt-1">
                        Connected as: {connected.email}
                      </p>
                    )}
                    {connected?.workspace && (
                      <p className="text-xs text-grey mt-1">
                        Workspace: {connected.workspace}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  {connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectMutation.mutate(connected.id)}
                      disabled={disconnectMutation.isPending}
                    >
                      {disconnectMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(integration.type)}
                      disabled={integration.type === 'whatsapp'}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
