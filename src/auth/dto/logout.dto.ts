import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  // The original refresh token provided by the client.
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}