import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateApiKeyDto {
  // Name used to identify the API key.
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  // Optional expiry date for the API key.
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
