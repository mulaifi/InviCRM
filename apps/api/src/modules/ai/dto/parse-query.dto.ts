import { IsString, MinLength, MaxLength } from 'class-validator';

export class ParseQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  query: string;
}
