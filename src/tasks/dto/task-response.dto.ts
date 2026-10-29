import { Task } from '../entities/task.entity.js';
import { TaskStatus } from '../../common/enums/task-status.enum.js';
import { TaskPriority } from '../../common/enums/task-priority.enum.js';
import { ProjectSummaryDto } from '../../common/dto/project-summary.dto.js';
import { UserSummaryDto } from '../../common/dto/user-summary.dto.js';

export class TaskResponseDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  project: ProjectSummaryDto;
  createdBy: UserSummaryDto;
  assignee: UserSummaryDto | null;
  createdAt: Date;
  updatedAt: Date;

  // Converts a Task entity (with relations loaded) into the API shape.
  static fromEntity(task: Task): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      project: ProjectSummaryDto.fromEntity(task.project),
      createdBy: UserSummaryDto.fromEntity(task.createdBy),
      assignee: task.assignee ? UserSummaryDto.fromEntity(task.assignee) : null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
