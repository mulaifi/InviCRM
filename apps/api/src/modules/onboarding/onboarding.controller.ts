import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import {
  OnboardingStatusDto,
  GoogleAuthUrlDto,
  SlackInstallUrlDto,
  WhatsAppExtensionInfoDto,
} from './dto';
import { CompleteStepDto, SkipStepDto, StepCompletedResponseDto } from './dto/complete-step.dto';

@ApiTags('onboarding')
@Controller({ path: 'onboarding', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current onboarding status' })
  @ApiResponse({ status: 200, type: OnboardingStatusDto })
  async getStatus(@CurrentUser() user: CurrentUserData): Promise<OnboardingStatusDto> {
    return this.onboardingService.getStatus(user.id, user.tenantId);
  }

  @Get('google-auth-url')
  @ApiOperation({ summary: 'Get Google OAuth URL for Gmail/Calendar connection' })
  @ApiResponse({ status: 200, type: GoogleAuthUrlDto })
  async getGoogleAuthUrl(@CurrentUser() user: CurrentUserData): Promise<GoogleAuthUrlDto> {
    return this.onboardingService.getGoogleAuthUrl(user.id, user.tenantId);
  }

  @Get('slack-install-url')
  @ApiOperation({ summary: 'Get Slack OAuth installation URL' })
  @ApiResponse({ status: 200, type: SlackInstallUrlDto })
  async getSlackInstallUrl(
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<SlackInstallUrlDto> {
    return this.onboardingService.getSlackInstallUrl(tenantId);
  }

  @Get('whatsapp-extension')
  @ApiOperation({ summary: 'Get WhatsApp extension installation info' })
  @ApiResponse({ status: 200, type: WhatsAppExtensionInfoDto })
  async getWhatsAppExtensionInfo(
    @CurrentUser() user: CurrentUserData,
  ): Promise<WhatsAppExtensionInfoDto> {
    return this.onboardingService.getWhatsAppExtensionInfo(user.id, user.tenantId);
  }

  @Post('complete-step')
  @ApiOperation({ summary: 'Mark an onboarding step as complete' })
  @ApiResponse({ status: 200, type: StepCompletedResponseDto })
  async completeStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CompleteStepDto,
  ): Promise<StepCompletedResponseDto> {
    return this.onboardingService.markStepComplete(user.id, user.tenantId, dto.step);
  }

  @Post('skip-step')
  @ApiOperation({ summary: 'Skip an onboarding step' })
  @ApiResponse({ status: 200, type: StepCompletedResponseDto })
  async skipStep(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SkipStepDto,
  ): Promise<StepCompletedResponseDto> {
    return this.onboardingService.skipStep(user.id, user.tenantId, dto.step, dto.reason);
  }

  @Post('skip')
  @ApiOperation({ summary: 'Skip entire onboarding process' })
  @ApiResponse({ status: 200, type: StepCompletedResponseDto })
  async skipOnboarding(@CurrentUser() user: CurrentUserData): Promise<StepCompletedResponseDto> {
    return this.onboardingService.skipOnboarding(user.id, user.tenantId);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset onboarding to start over' })
  @ApiResponse({ status: 200, type: StepCompletedResponseDto })
  async resetOnboarding(@CurrentUser() user: CurrentUserData): Promise<StepCompletedResponseDto> {
    return this.onboardingService.resetOnboarding(user.id, user.tenantId);
  }
}
