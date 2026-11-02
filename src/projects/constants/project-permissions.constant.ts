import { ProjectRole } from '../../common/enums/project-role.enum.js';

/**
 * All project membership roles.
 * Useful for endpoints accessible to every project member.
 */
export const ALL_PROJECT_ROLES = [
  ProjectRole.OWNER,
  ProjectRole.ADMIN,
  ProjectRole.MEMBER,
  ProjectRole.VIEWER,
] as const;
