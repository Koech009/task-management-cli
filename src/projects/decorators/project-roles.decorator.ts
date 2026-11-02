import { SetMetadata } from '@nestjs/common';
import { ProjectRole } from '../../common/enums/project-role.enum.js';

/**
 * Unique metadata key used to store project role requirements.
 *
 * The ProjectRolesGuard will use this key to retrieve
 * the roles required by a controller or endpoint.
 */
export const PROJECT_ROLES_KEY = 'project_roles';

/**
 * Custom decorator for specifying which project membership
 * roles are allowed to access a particular endpoint.
 *
 * @param roles - One or more permitted ProjectRole values.
 *
 * Example:
 * @ProjectRoles(ProjectRole.OWNER)
 *
 * Example with multiple roles:
 * @ProjectRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
 *
 * NOTE:
 * This decorator only attaches metadata.
 * It does NOT check the user's membership or permissions.
 * ProjectRolesGuard is responsible for enforcing authorization.
 */
export const ProjectRoles = (...roles: ProjectRole[]) =>
  SetMetadata(PROJECT_ROLES_KEY, roles);
