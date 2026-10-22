
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum.js';

// The metadata key used by RolesGuard.
export const ROLES_KEY = 'roles';

// Specify which roles may access a route.
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(ROLES_KEY, roles);
