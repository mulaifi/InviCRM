import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum OnboardingStepType {
  GMAIL = 'gmail',
  CALENDAR = 'calendar',
  SLACK = 'slack',
  WHATSAPP = 'whatsapp',
}

export class CompleteStepDto {
  @ApiProperty({
    description: 'The step that was completed',
    enum: OnboardingStepType,
  })
  @IsEnum(OnboardingStepType)
  step: OnboardingStepType;

  @ApiProperty({ description: 'Additional metadata for the step', required: false })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class SkipStepDto {
  @ApiProperty({
    description: 'The step to skip',
    enum: OnboardingStepType,
  })
  @IsEnum(OnboardingStepType)
  step: OnboardingStepType;

  @ApiProperty({ description: 'Reason for skipping', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class StepCompletedResponseDto {
  @ApiProperty({ description: 'Whether the operation succeeded' })
  success: boolean;

  @ApiProperty({ description: 'The next step in the onboarding flow' })
  nextStep: string;

  @ApiProperty({ description: 'Message describing the result' })
  message: string;
}
