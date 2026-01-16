import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  MaxLength,
  IsDateString,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({
    enum: ['email', 'call', 'meeting', 'note', 'whatsapp', 'sms'],
  })
  @IsIn(['email', 'call', 'meeting', 'note', 'whatsapp', 'sms'])
  type: string;

  @ApiProperty({ enum: ['inbound', 'outbound'], required: false })
  @IsOptional()
  @IsIn(['inbound', 'outbound'])
  direction?: string;

  @ApiProperty({ example: 'Follow-up call about proposal' })
  @IsString()
  @MaxLength(500)
  subject: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  body?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
