import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { TaskStatus } from '../../common/enums/task-status.enum.js';
import { TaskPriority } from '../../common/enums/task-priority.enum.js';

// Only these fields are allowed for sorting.
const TASK_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'title',
  'dueDate',
  'priority',
  'status',
] as const;

export class TaskQueryDto {
  // Example: GET /tasks?search=jwt
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  // Example: GET /tasks?status=TODO
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  // Example: GET /tasks?priority=HIGH
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  // Example: GET /tasks?projectId=<project UUID>
  @IsOptional()
  @IsUUID()
  projectId?: string;

  // Example: GET /tasks?page=2
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  // Example: GET /tasks?limit=20
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  // Example: GET /tasks?sortBy=title
  @IsOptional()
  @IsIn(TASK_SORT_FIELDS)
  sortBy: (typeof TASK_SORT_FIELDS)[number] = 'createdAt';

  // Example: GET /tasks?sortOrder=ASC
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC';
}
