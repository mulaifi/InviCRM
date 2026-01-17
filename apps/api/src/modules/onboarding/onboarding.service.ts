import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnboardingState, OnboardingStep, UserIntegration, SlackInstallation } from '@invicrm/database';
import {
  OnboardingStatusDto,
  GoogleAuthUrlDto,
  SlackInstallUrlDto,
  WhatsAppExtensionInfoDto,
  IntegrationStatus,
} from './dto';
import { OnboardingStepType, StepCompletedResponseDto } from './dto/complete-step.dto';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingState)
    private readonly onboardingRepository: Repository<OnboardingState>,
    @InjectRepository(UserIntegration)
    private readonly integrationRepository: Repository<UserIntegration>,
    @InjectRepository(SlackInstallation)
    private readonly slackRepository: Repository<SlackInstallation>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async getOrCreateState(userId: string, tenantId: string): Promise<OnboardingState> {
    let state = await this.onboardingRepository.findOne({
      where: { userId, tenantId, isDeleted: false },
    });

    if (!state) {
      state = this.onboardingRepository.create({
        userId,
        tenantId,
        currentStep: OnboardingStep.GMAIL,
        gmailConnected: false,
        calendarConnected: false,
        slackConnected: false,
        whatsappPrompted: false,
      });
      await this.onboardingRepository.save(state);
    }

    return state;
  }

  async getStatus(userId: string, tenantId: string): Promise<OnboardingStatusDto> {
    const state = await this.getOrCreateState(userId, tenantId);

    // Check actual integration status from database
    const googleIntegration = await this.integrationRepository.findOne({
      where: { userId, provider: 'google', isActive: true },
    });

    const slackInstallation = await this.slackRepository.findOne({
      where: { tenantId, isActive: true },
    });

    // Update state based on actual integrations
    const gmailConnected = !!googleIntegration?.accessToken;
    const calendarConnected = gmailConnected; // Same OAuth covers both
    const slackConnected = !!slackInstallation?.botAccessToken;

    // Sync state if it's out of date
    if (
      state.gmailConnected !== gmailConnected ||
      state.calendarConnected !== calendarConnected ||
      state.slackConnected !== slackConnected
    ) {
      state.gmailConnected = gmailConnected;
      state.calendarConnected = calendarConnected;
      state.slackConnected = slackConnected;
      await this.onboardingRepository.save(state);
    }

    // Calculate current step
    let currentStep = OnboardingStep.GMAIL;
    if (gmailConnected) currentStep = OnboardingStep.SLACK;
    if (gmailConnected && slackConnected) currentStep = OnboardingStep.WHATSAPP;
    if (gmailConnected && slackConnected && state.whatsappPrompted) {
      currentStep = OnboardingStep.COMPLETE;
    }

    // Update current step if changed
    if (state.currentStep !== currentStep) {
      state.currentStep = currentStep;
      if (currentStep === OnboardingStep.COMPLETE && !state.completedAt) {
        state.completedAt = new Date();
      }
      await this.onboardingRepository.save(state);
    }

    // Calculate progress
    const steps = [gmailConnected, slackConnected, state.whatsappPrompted];
    const completedSteps = steps.filter(Boolean).length;
    const progressPercent = Math.round((completedSteps / 3) * 100);

    const gmail: IntegrationStatus = {
      connected: gmailConnected,
      connectedAt: googleIntegration?.createdAt,
      externalId: googleIntegration?.externalId,
    };

    const calendar: IntegrationStatus = {
      connected: calendarConnected,
      connectedAt: googleIntegration?.createdAt,
      externalId: googleIntegration?.externalId,
    };

    const slack: IntegrationStatus = {
      connected: slackConnected,
      connectedAt: slackInstallation?.installedAt,
      externalId: slackInstallation?.teamName,
    };

    const whatsapp: IntegrationStatus = {
      connected: state.whatsappPrompted,
    };

    return {
      currentStep,
      isComplete: currentStep === OnboardingStep.COMPLETE,
      gmail,
      calendar,
      slack,
      whatsapp,
      progressPercent,
      completedAt: state.completedAt ?? undefined,
    };
  }

  async getGoogleAuthUrl(userId: string, tenantId: string): Promise<GoogleAuthUrlDto> {
    const clientId = this.configService.get<string>('google.clientId');
    const callbackUrl = this.configService.get<string>('google.callbackUrl');

    if (!clientId) {
      throw new NotFoundException('Google OAuth is not configured');
    }

    // Create state parameter with user info for callback
    const statePayload = {
      userId,
      tenantId,
      source: 'onboarding',
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

    const scopes = [
      'email',
      'profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl || '',
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return {
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      state,
    };
  }

  async getSlackInstallUrl(tenantId: string): Promise<SlackInstallUrlDto> {
    const clientId = this.configService.get<string>('slack.clientId');

    if (!clientId) {
      throw new NotFoundException('Slack OAuth is not configured');
    }

    const scopes = [
      'app_mentions:read',
      'channels:history',
      'channels:read',
      'chat:write',
      'commands',
      'groups:history',
      'groups:read',
      'im:history',
      'im:read',
      'im:write',
      'mpim:history',
      'mpim:read',
      'users:read',
      'users:read.email',
    ];

    const state = Buffer.from(JSON.stringify({ tenantId })).toString('base64url');

    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes.join(','),
      state,
    });

    return {
      installUrl: `https://slack.com/oauth/v2/authorize?${params.toString()}`,
    };
  }

  async getWhatsAppExtensionInfo(userId: string, tenantId: string): Promise<WhatsAppExtensionInfoDto> {
    const frontendUrl = this.configService.get<string>('frontend.url');
    const apiUrl = this.configService.get<string>('port');

    // Generate a long-lived token for the extension
    const extensionToken = this.jwtService.sign(
      {
        sub: userId,
        tenantId,
        purpose: 'whatsapp-extension',
      },
      { expiresIn: '365d' },
    );

    return {
      chromeStoreUrl: 'chrome://extensions/', // Update when published
      manualInstallUrl: `${frontendUrl}/extensions/whatsapp`,
      apiToken: extensionToken,
      apiBaseUrl: `http://localhost:${apiUrl || 3000}`,
    };
  }

  async markStepComplete(
    userId: string,
    tenantId: string,
    step: OnboardingStepType,
  ): Promise<StepCompletedResponseDto> {
    const state = await this.getOrCreateState(userId, tenantId);

    switch (step) {
      case OnboardingStepType.GMAIL:
      case OnboardingStepType.CALENDAR:
        state.gmailConnected = true;
        state.calendarConnected = true;
        state.currentStep = OnboardingStep.SLACK;
        break;

      case OnboardingStepType.SLACK:
        state.slackConnected = true;
        state.currentStep = OnboardingStep.WHATSAPP;
        break;

      case OnboardingStepType.WHATSAPP:
        state.whatsappPrompted = true;
        state.currentStep = OnboardingStep.COMPLETE;
        state.completedAt = new Date();
        break;
    }

    await this.onboardingRepository.save(state);

    return {
      success: true,
      nextStep: state.currentStep,
      message: `Step '${step}' marked as complete`,
    };
  }

  async skipStep(
    userId: string,
    tenantId: string,
    step: OnboardingStepType,
    reason?: string,
  ): Promise<StepCompletedResponseDto> {
    const state = await this.getOrCreateState(userId, tenantId);

    // Store skip reason in metadata
    const metadata = (state.metadata || {}) as Record<string, unknown>;
    metadata[`${step}_skipped`] = true;
    metadata[`${step}_skip_reason`] = reason;
    state.metadata = metadata;

    // Move to next step
    switch (step) {
      case OnboardingStepType.GMAIL:
      case OnboardingStepType.CALENDAR:
        state.currentStep = OnboardingStep.SLACK;
        break;

      case OnboardingStepType.SLACK:
        state.currentStep = OnboardingStep.WHATSAPP;
        break;

      case OnboardingStepType.WHATSAPP:
        state.whatsappPrompted = true;
        state.currentStep = OnboardingStep.COMPLETE;
        state.completedAt = new Date();
        break;
    }

    await this.onboardingRepository.save(state);

    return {
      success: true,
      nextStep: state.currentStep,
      message: `Step '${step}' skipped`,
    };
  }

  async skipOnboarding(userId: string, tenantId: string): Promise<StepCompletedResponseDto> {
    const state = await this.getOrCreateState(userId, tenantId);

    state.currentStep = OnboardingStep.COMPLETE;
    state.skippedAt = new Date();
    state.metadata = { ...state.metadata, skipped: true };

    await this.onboardingRepository.save(state);

    return {
      success: true,
      nextStep: OnboardingStep.COMPLETE,
      message: 'Onboarding skipped',
    };
  }

  async resetOnboarding(userId: string, tenantId: string): Promise<StepCompletedResponseDto> {
    const state = await this.getOrCreateState(userId, tenantId);

    state.currentStep = OnboardingStep.GMAIL;
    state.gmailConnected = false;
    state.calendarConnected = false;
    state.slackConnected = false;
    state.whatsappPrompted = false;
    state.completedAt = null;
    state.skippedAt = null;
    state.metadata = {};

    await this.onboardingRepository.save(state);

    return {
      success: true,
      nextStep: OnboardingStep.GMAIL,
      message: 'Onboarding reset',
    };
  }
}
