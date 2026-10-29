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
// import { UpdateTaskStatusDto } from './dto/update-task-status.dto.js';
import { TaskQueryDto } from './dto/task-query.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { LoggingInterceptor } from '../common/interceptors/logging/logging.interceptor.js';
import { TransformInterceptor } from '../common/interceptors/transform/transform.interceptor.js';
import { ErrorsInterceptor } from '../common/interceptors/errors/errors.interceptor.js';
// import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';

@Controller('tasks')
@UseInterceptors(LoggingInterceptor)
@UseInterceptors(TransformInterceptor)
@UseInterceptors(ErrorsInterceptor)
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    // Inject the service containing task business logic.
    private readonly tasksService: TasksService,
  ) {}

  /**
   * POST /tasks
   * Creates a task in a project.
   */
  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // The authenticated user's ID becomes the task creator.
    return this.tasksService.create(createTaskDto, user.id);
  }

  /**
   * GET /tasks
   * Lists accessible tasks with search, filters, sorting and pagination.
   
   */
  @Get()
  findAll(
    @Query() query: TaskQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.findAll(user.id, query);
  }

  /**
   * GET /tasks/:taskId
   * Retrieves one task if the user can access its project.
   */
  @Get(':taskId')
  findOne(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.findOne(taskId, user.id);
  }

  /**
   * PATCH /tasks/:taskId
   * Updates editable task details.
   */
  @Patch(':taskId')
  update(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.update(taskId, updateTaskDto, user.id);
  }

  /**
   * PATCH /tasks/:taskId/assignee
   * Assigns a user or removes the current assignment.
   */
  @Patch(':taskId/assignee')
  assign(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() assignTaskDto: AssignTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.assign(taskId, assignTaskDto, user.id);
  }

  /**
   * PATCH /tasks/:taskId/status
   * Changes the task's status.
   */
  @Patch(':taskId/status')
  updateStatus(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() updateTaskStatusDto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.updateStatus(taskId, updateTaskStatusDto, user.id);
  }

  /**
   * DELETE /tasks/:taskId
   * Deletes a task.
   */
  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.tasksService.remove(taskId, user.id);
  }
}
