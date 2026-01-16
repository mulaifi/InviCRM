import {
  IsEmail,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsIn,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ example: 'john.doe@acme.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+965-1234-5678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ example: 'Sales Director', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({
    enum: ['manual', 'email_sync', 'calendar_sync', 'whatsapp', 'import'],
    required: false,
  })
  @IsOptional()
  @IsIn(['manual', 'email_sync', 'calendar_sync', 'whatsapp', 'import'])
  source?: string;

  @ApiProperty({ minimum: 0, maximum: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}
