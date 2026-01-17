import { ApiProperty } from '@nestjs/swagger';

export class IntegrationStatus {
  @ApiProperty({ description: 'Whether the integration is connected' })
  connected: boolean;

  @ApiProperty({ description: 'When the integration was connected', required: false })
  connectedAt?: Date;

  @ApiProperty({ description: 'External identifier (email, team name, etc.)', required: false })
  externalId?: string;
}

export class OnboardingStatusDto {
  @ApiProperty({
    description: 'Current onboarding step',
    enum: ['gmail', 'calendar', 'slack', 'whatsapp', 'complete'],
  })
  currentStep: string;

  @ApiProperty({ description: 'Whether onboarding is complete' })
  isComplete: boolean;

  @ApiProperty({ description: 'Gmail integration status' })
  gmail: IntegrationStatus;

  @ApiProperty({ description: 'Calendar integration status (shared with Gmail OAuth)' })
  calendar: IntegrationStatus;

  @ApiProperty({ description: 'Slack workspace integration status' })
  slack: IntegrationStatus;

  @ApiProperty({ description: 'WhatsApp extension prompt status' })
  whatsapp: IntegrationStatus;

  @ApiProperty({ description: 'Percentage of onboarding completed (0-100)' })
  progressPercent: number;

  @ApiProperty({ description: 'When onboarding was completed', required: false })
  completedAt?: Date;
}

export class GoogleAuthUrlDto {
  @ApiProperty({ description: 'Google OAuth authorization URL' })
  authUrl: string;

  @ApiProperty({ description: 'State parameter for CSRF protection' })
  state: string;
}

export class SlackInstallUrlDto {
  @ApiProperty({ description: 'Slack OAuth installation URL' })
  installUrl: string;
}

export class WhatsAppExtensionInfoDto {
  @ApiProperty({ description: 'Chrome Web Store URL for the extension' })
  chromeStoreUrl: string;

  @ApiProperty({ description: 'Manual installation instructions' })
  manualInstallUrl: string;

  @ApiProperty({ description: 'API token for the extension to use' })
  apiToken: string;

  @ApiProperty({ description: 'API base URL for the extension' })
  apiBaseUrl: string;
}
