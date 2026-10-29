import { IsOptional, IsUUID } from 'class-validator';

export class AssignTaskDto {
  // null means unassign the task.
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;
}
//handles assigming a task to user or removing ists assignment
