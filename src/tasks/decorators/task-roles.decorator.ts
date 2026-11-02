import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from '../../common/enums/project-role.enum.js';

export const TASK_ROLES_KEY = 'task_roles';

export const TaskRoles = (...roles: ProjectRole[]) =>
  SetMetadata(TASK_ROLES_KEY, roles);
