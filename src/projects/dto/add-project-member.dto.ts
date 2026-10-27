import { IsIn, IsUUID } from 'class-validator';
import { ProjectRole } from '../../common/enums/project-role.enum.js';

export class AddProjectMemberDto {
  @IsUUID()
  userId: string;

  @IsIn([ProjectRole.MEMBER, ProjectRole.VIEWER])
  role: ProjectRole = ProjectRole.MEMBER;
}
