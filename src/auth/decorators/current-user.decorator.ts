import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();

    return request.user;
  },
);