
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumberString,
  IsIn,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

import { UserRole } from '../../common/enums/user-role.enum.js';

export class QueryUsersDto {
  // Search users by name or email.
  @IsOptional()
  @IsString({
    message: 'Search must be a string.',
  })
  @MinLength(1, {
    message: 'Search must contain at least one character.',
  })
  @MaxLength(100, {
    message: 'Search must not exceed 100 characters.',
  })
  search?: string;

  // Filter users by their role.
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role must be a valid user role.',
  })
  role?: UserRole;

  // Restrict sorting to supported fields.
  @IsOptional()
  @IsIn(
    ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
    {
      message:
        'sortBy must be one of: id, name, email, role, createdAt, updatedAt.',
    },
  )
  sortBy?: string;

  // Specify the sort direction.
  @IsOptional()
  @IsIn(['ASC', 'DESC'], {
    message: 'Order must be either ASC or DESC.',
  })
  order?: 'ASC' | 'DESC';

  // Page number must be a positive whole number.
  @IsOptional()
  @IsNumberString(
    { no_symbols: true },
    { message: 'Page must be a positive whole number.' },
  )
  @Matches(/^[1-9]\d*$/, {
    message: 'Page must be greater than zero.',
  })
  page?: string;

  // Limit must be a positive whole number.
  @IsOptional()
  @IsNumberString(
    { no_symbols: true },
    { message: 'Limit must be a positive whole number.' },
  )
  @Matches(/^[1-9]\d*$/, {
    message: 'Limit must be greater than zero.',
  })
  limit?: string;
}
