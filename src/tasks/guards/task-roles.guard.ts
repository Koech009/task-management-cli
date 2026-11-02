import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';

import { TASK_ROLES_KEY } from '../decorators/task-roles.decorator.js';
import { ProjectRole } from '../../common/enums/project-role.enum.js';
import { TasksService } from '../tasks.service.js';
import { ProjectMembersService } from '../../projects/project-members/project-members.service.js';

@Injectable()
export class TaskRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tasksService: TasksService,
    private readonly projectMembersService: ProjectMembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the roles required by this task endpoint.
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(
      TASK_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const taskId = request.params?.taskId;

    if (!taskId || !isUUID(taskId)) {
      throw new BadRequestException('A valid task ID is required');
    }

    // Retrieve the task to identify its project.
    const task = await this.tasksService.findTaskForAuthorization(taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check the user's role in the task's project.
    const userRole = await this.projectMembersService.getUserProjectRole(
      task.projectId,
      user.id,
    );

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        'You do not have permission to access this task',
      );
    }

    return true;
  }
}
