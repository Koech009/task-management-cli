import { Project } from '../../projects/entities/project.entity.js';

// Minimal project info for embedding inside other responses (e.g. tasks).
export class ProjectSummaryDto {
  id: string;
  name: string;

  static fromEntity(project: Project): ProjectSummaryDto {
    return {
      id: project.id,
      name: project.name,
    };
  }
}
