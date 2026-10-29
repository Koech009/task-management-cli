import { Project } from '../entities/project.entity.js';
import { UserSummaryDto } from '../../common/dto/user-summary.dto.js';

// Full project response. Requires the createdBy relation to be loaded.
export class ProjectResponseDto {
  id: string;
  name: string;
  description: string | null;
  createdBy: UserSummaryDto;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdBy: UserSummaryDto.fromEntity(project.createdBy),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
