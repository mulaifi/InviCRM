import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MergeContactsDto {
  @ApiProperty({
    description: 'UUID of the primary contact to keep',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID('4', { message: 'primaryId must be a valid UUID' })
  primaryId: string;

  @ApiProperty({
    description: 'UUID of the secondary contact to merge into primary (will be deleted)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsNotEmpty()
  @IsUUID('4', { message: 'secondaryId must be a valid UUID' })
  secondaryId: string;
}
