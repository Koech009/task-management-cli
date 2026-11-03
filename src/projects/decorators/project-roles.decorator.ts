import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from '../../common/enums/project-role.enum.js';

//identifier used to store and receive metadata
export const PROJECT_ROLES_KEY = 'project_roles';

export const ProjectRoles = (...roles: ProjectRole[]) =>
  SetMetadata(PROJECT_ROLES_KEY, roles);
