import { IsString, MinLength, MaxLength, IsOptional, IsObject } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  query: string;

  @IsOptional()
  @IsObject()
  context?: {
    zoomLevel?: string;
    filters?: Record<string, unknown>;
  };
}
