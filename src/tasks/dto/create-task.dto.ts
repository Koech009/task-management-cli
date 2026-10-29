import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { TaskPriority } from '../../common/enums/task-priority.enum.js';

export class CreateTaskDto {
  // The project in which the task will be created.
  @IsUUID()
  projectId: string;

  // A short title is required.
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  // Description is optional.
  @IsOptional()
  @IsString()
  description?: string;

  // Priority is optional; the entity defaults to MEDIUM.
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  // An optional UUID of the user to assign the task to.
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  // An optional deadline in ISO 8601 date format.
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
