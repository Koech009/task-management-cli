
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsString({
    message: 'Name must be a valid string.',
  })
  @IsNotEmpty({
    message: 'Name is required.',
  })
  @Matches(/\S/, {
    message: 'Name must not contain only whitespace.',
  })
  @MaxLength(100, {
    message: 'Name must not exceed 100 characters.',
  })
  name!: string;

  @IsNotEmpty({
    message: 'Email address is required.',
  })
  @IsEmail({}, {
    message: 'Please enter a valid email address.',
  })
  @MaxLength(254, {
    message: 'Email address must not exceed 254 characters.',
  })
  email!: string;

  @IsNotEmpty({
    message: 'Password is required.',
  })
  @IsString({
    message: 'Password must be a string.',
  })
  @MinLength(12, {
    message: 'Password must be at least 12 characters long.',
  })
  @MaxLength(72, {
    message: 'Password must not exceed 72 characters.',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter (a-z).',
  })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter (A-Z).',
  })
  @Matches(/[0-9]/, {
    message: 'Password must contain at least one number (0-9).',
  })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'Password must contain at least one special character (e.g. @, #, $, !).',
  })
  password!: string;
}
