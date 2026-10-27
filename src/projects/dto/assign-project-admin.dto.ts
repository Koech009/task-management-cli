import { Equals } from 'class-validator';
import { ProjectRole } from '../../common/enums/project-role.enum.js';

export class AssignProjectAdminDto {
  @Equals(ProjectRole.ADMIN, {
    message: 'This endpoint can only assign the ADMIN role.',
  })
  role: ProjectRole;
}
//@Equals(ProjectRole.Admin) ensures the request can only contain "role":"ADMIN"
