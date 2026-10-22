
import {
  // Interface that a NestJS guard must implement.
  CanActivate,

  // Provides information about the current request and route.
  ExecutionContext,

  // Throws HTTP 403 Forbidden when access is not permitted.
  ForbiddenException,

  // Marks this class as available for NestJS dependency injection.
  Injectable,
} from '@nestjs/common';

// Reads metadata that decorators such as @Roles() attach to routes.
import { Reflector } from '@nestjs/core';

// Import only the Express Request type.
// This is a TypeScript type, not a runtime JavaScript value.
import type { Request } from 'express';

// Import the metadata key used by the @Roles() decorator.
import { ROLES_KEY } from '../decorators/roles.decorator.js';

// Import the enum defining valid roles in this application.
import { UserRole } from '../../common/enums/user-role.enum.js';

/**
 * Describes the user information that we expect Passport
 * to attach to the HTTP request after authentication.
 */
interface RequestUser {
  id: string;       // The user's unique UUID.
  email: string;    // The authenticated user's email.
  role: UserRole;   // Their role: USER or ADMIN.
}

/**
 * Injectable allows NestJS to create this guard and inject
 * its dependencies, including Reflector.
 *
 * CanActivate tells NestJS that this class implements a guard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Dependency injection:
   * NestJS provides an instance of Reflector for reading metadata.
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * NestJS calls canActivate() when it evaluates this guard.
   *
   * true  -> the request may continue.
   * false -> NestJS rejects the request, normally with 403.
   *
   * This method can also throw an HTTP exception directly.
   */
  canActivate(context: ExecutionContext): boolean {

    // Read the roles required by this route or its controller.
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY, // The metadata key used by @Roles().
      [
        context.getHandler(), // The current controller method.
        context.getClass(),   // The controller class itself.
      ],
    );

    // If no roles are specified, this guard imposes no role restriction.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Switch to the HTTP context and retrieve the current Express request.
    // The extra type tells TypeScript that request.user may exist.
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();

    // Passport normally attaches the result of JwtStrategy.validate()
    // to request.user after successful authentication.
    const user = request.user;

    // If roles are required but no user is attached, deny access.
    if (!user) {
      throw new ForbiddenException(
        'Authenticated user is required',
      );
    }

    // Check whether the user's role appears in the allowed roles.
    // For example, [UserRole.ADMIN].includes(UserRole.USER) is false.
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    // The user has an allowed role, so let the request continue.
    return true;
  }
}
