import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';

import { PROJECT_ROLES_KEY } from '../decorators/project-roles.decorator.js';
import { ProjectRole } from '../../common/enums/project-role.enum.js';
import { ProjectMembersService } from '../project-members/project-members.service.js';

@Injectable()
export class ProjectRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly projectMembersService: ProjectMembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the roles required by this endpoint.
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(
      PROJECT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No project-role requirement means this guard has nothing to check.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // JwtAuthGuard should have populated request.user.
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const projectId = request.params?.projectId;

    if (!projectId || !isUUID(projectId)) {
      throw new BadRequestException('A valid project ID is required');
    }

    // Find the user's role in this particular project.
    const userRole = await this.projectMembersService.getUserProjectRole(
      projectId,
      user.id,
    );

    if (!userRole) {
      throw new ForbiddenException('You are not a member of this project');
    }

    // Check whether the user's role is allowed.
    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
