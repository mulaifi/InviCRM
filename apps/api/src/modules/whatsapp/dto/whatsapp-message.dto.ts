import { IsString, IsOptional, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WhatsAppMessageDto {
  @ApiProperty({ description: 'Unique message identifier' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Chat identifier (usually phone number)' })
  @IsString()
  chatId: string;

  @ApiProperty({ description: 'Contact or group name' })
  @IsString()
  chatName: string;

  @ApiProperty({ description: 'Phone number if available', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Message text content' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Message timestamp' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Message direction', enum: ['incoming', 'outgoing'] })
  @IsIn(['incoming', 'outgoing'])
  direction: 'incoming' | 'outgoing';

  @ApiProperty({ description: 'When the message was captured' })
  @IsString()
  capturedAt: string;
}

export class SyncWhatsAppMessagesDto {
  @ApiProperty({ type: [WhatsAppMessageDto], description: 'Array of messages to sync' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppMessageDto)
  messages: WhatsAppMessageDto[];
}
