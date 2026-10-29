import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { Request } from 'express';
import { UserRole } from '../../common/enums/user-role.enum.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();

    return request.user;
  },
);
