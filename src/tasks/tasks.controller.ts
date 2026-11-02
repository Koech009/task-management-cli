import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { TasksService } from './tasks.service.js';

import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { AssignTaskDto } from './dto/assign-task.dto.js';
import { TaskQueryDto } from './dto/task-query.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

import { LoggingInterceptor } from '../common/interceptors/logging/logging.interceptor.js';
import { TransformInterceptor } from '../common/interceptors/transform/transform.interceptor.js';
import { ErrorsInterceptor } from '../common/interceptors/errors/errors.interceptor.js';

import { TaskRoles } from './decorators/task-roles.decorator.js';
import { TaskRolesGuard } from './guards/task-roles.guard.js';
import { ProjectRole } from '../common/enums/project-role.enum.js';

@Controller('tasks')
@UseInterceptors(LoggingInterceptor)
@UseInterceptors(TransformInterceptor)
@UseInterceptors(ErrorsInterceptor)
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Create a task
  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.create(createTaskDto, user.id);
  }

  // View tasks accessible to the current user
  @Get()
  findAll(
    @Query() query: TaskQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.findAll(user.id, query);
  }

  // View a specific task
  @Get(':taskId')
  @UseGuards(TaskRolesGuard)
  @TaskRoles(
    ProjectRole.OWNER,
    ProjectRole.ADMIN,
    ProjectRole.MEMBER,
    ProjectRole.VIEWER,
  )
  findOne(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.findOne(taskId, user.id);
  }

  // Update task details
  @Patch(':taskId')
  @UseGuards(TaskRolesGuard)
  @TaskRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  update(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.update(taskId, updateTaskDto, user.id);
  }

  // Assign a task
  @Patch(':taskId/assignee')
  @UseGuards(TaskRolesGuard)
  @TaskRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  assign(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() assignTaskDto: AssignTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.assign(taskId, assignTaskDto, user.id);
  }

  // Update task progress
  @Patch(':taskId/status')
  @UseGuards(TaskRolesGuard)
  @TaskRoles(ProjectRole.OWNER, ProjectRole.ADMIN, ProjectRole.MEMBER)
  updateStatus(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.updateStatus(taskId, updateTaskDto, user.id);
  }

  // Delete a task
  @Delete(':taskId')
  @UseGuards(TaskRolesGuard)
  @TaskRoles(ProjectRole.OWNER, ProjectRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.tasksService.remove(taskId, user.id);
  }
}
