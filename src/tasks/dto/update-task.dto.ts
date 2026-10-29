import { PartialType } from '@nestjs/mapped-types';
// import { TaskDetailsDto } from './task-details.dto.js';
import { TaskDetailsDto } from './task-details.dto.js';

// All editable detail fields become optional for PATCH requests.
// projectId, createdById, assigneeId, and status are excluded.
export class UpdateTaskDto extends PartialType(TaskDetailsDto) {}
