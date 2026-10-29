import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Task } from './entities/task.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { ProjectMember } from '../projects/entities/project-member.entity.js';
import { User } from '../users/entities/user.entity.js';

import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TaskResponseDto } from './dto/task-response.dto.js';

import { ProjectRole } from '../common/enums/project-role.enum.js';
import { TaskPriority } from '../common/enums/task-priority.enum.js';
import { TaskQueryDto } from './dto/task-query.dto.js';
import { AssignTaskDto } from './dto/assign-task.dto.js';

@Injectable()
export class TasksService {
  constructor(
    // Performs task database operations.
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,

    // Checks that projects exist.
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,

    // Checks project membership and project-specific roles.
    @InjectRepository(ProjectMember)
    private readonly projectMembersRepository: Repository<ProjectMember>,

    // Checks that users selected as assignees exist.
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Reusable list of project roles allowed to manage task details.
  private readonly managerRoles = [ProjectRole.OWNER, ProjectRole.ADMIN];

  // Relations needed to build a TaskResponseDto.
  private readonly taskRelations = {
    project: true,
    createdBy: true,
    assignee: true,
  };

  /**
   * Finds a user's membership in a project.
   * Throws 403 when the user is not a member.
   */
  private async requireMembership(
    projectId: string,
    userId: string,
  ): Promise<ProjectMember> {
    const membership = await this.projectMembersRepository.findOne({
      where: { projectId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this project.');
    }

    return membership;
  }

  /**
   * Ensures a user has OWNER or ADMIN privileges.
   */
  private requireManagerRole(membership: ProjectMember): void {
    if (!this.managerRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'Only project owners and admins can perform this action.',
      );
    }
  }

  /**
   * Finds a task (with project, creator and assignee loaded) and verifies
   * that the requester belongs to its project.
   */
  private async findAccessibleTask(
    taskId: string,
    requesterId: string,
  ): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
      relations: this.taskRelations,
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    await this.requireMembership(task.projectId, requesterId);

    return task;
  }

  /**
   * CREATE
   * Creates a task inside an existing project.
   */
  async create(
    dto: CreateTaskDto,
    requesterId: string,
  ): Promise<TaskResponseDto> {
    // Confirm the project exists.
    const project = await this.projectsRepository.findOne({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // The requester must be an OWNER or ADMIN of this project.
    const membership = await this.requireMembership(dto.projectId, requesterId);

    this.requireManagerRole(membership);

    // Verify that an optional assignee exists and belongs to the project.
    let assignee: User | null = null;

    if (dto.assigneeId) {
      assignee = await this.usersRepository.findOne({
        where: { id: dto.assigneeId },
      });

      if (!assignee) {
        throw new NotFoundException('Assignee not found.');
      }

      await this.requireMembership(dto.projectId, dto.assigneeId);
    }

    // Convert the ISO date string to a Date object for TypeORM.
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    // Construct the entity. The creator is taken from the JWT identity.
    const task = this.tasksRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      priority: dto.priority ?? TaskPriority.MEDIUM,
      project,
      projectId: project.id,
      createdById: requesterId,
      assignee,
      assigneeId: assignee?.id ?? null,
      dueDate,
    });

    // The entity/database supplies the UUID, TODO status, and timestamps.
    const saved = await this.tasksRepository.save(task);

    // Re-fetch so createdBy (and every other relation) is loaded.
    const created = await this.tasksRepository.findOneOrFail({
      where: { id: saved.id },
      relations: this.taskRelations,
    });

    return TaskResponseDto.fromEntity(created);
  }

  /**
   * READ ALL
   * Lists tasks accessible to the requester, with filtering and pagination.
   */
  async findAll(requesterId: string, query: TaskQueryDto) {
    const {
      search,
      status,
      priority,
      projectId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    // Restrict results to projects where this user is a member.
    const queryBuilder = this.tasksRepository
      .createQueryBuilder('task')
      .innerJoin(
        ProjectMember,
        'membership',
        `membership.projectId = task.projectId
         AND membership.userId = :requesterId`,
        { requesterId },
      )
      // Load the related records needed for the response.
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignee', 'assignee');

    // Search both task titles and descriptions.
    if (search) {
      queryBuilder.andWhere(
        `(
          LOWER(task.title) LIKE LOWER(:search)
          OR LOWER(task.description) LIKE LOWER(:search)
        )`,
        { search: `%${search}%` },
      );
    }

    // Apply the optional status filter.
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    // Apply the optional priority filter.
    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    // Optionally narrow the list to a particular project.
    if (projectId) {
      queryBuilder.andWhere('task.projectId = :projectId', { projectId });
    }

    // Sort only by a field validated in TaskQueryDto.
    queryBuilder.orderBy(`task.${sortBy}`, sortOrder);

    // Use the task ID as a stable secondary sort.
    queryBuilder.addOrderBy('task.id', 'ASC');

    // Convert page number into the number of records to skip.
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // getManyAndCount returns the current page and total matching count.
    const [tasks, total] = await queryBuilder.getManyAndCount();

    return {
      data: tasks.map((task) => TaskResponseDto.fromEntity(task)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * READ ONE
   * Returns a task only if it belongs to a project the requester can access.
   */
  async findOne(taskId: string, requesterId: string): Promise<TaskResponseDto> {
    const task = await this.findAccessibleTask(taskId, requesterId);

    return TaskResponseDto.fromEntity(task);
  }

  /**
   * UPDATE DETAILS
   * Allows OWNERs and ADMINs to edit task details.
   * Status is not changed here; it has its own endpoint.
   */
  async update(
    taskId: string,
    dto: UpdateTaskDto,
    requesterId: string,
  ): Promise<TaskResponseDto> {
    const task = await this.findAccessibleTask(taskId, requesterId);

    const membership = await this.requireMembership(
      task.projectId,
      requesterId,
    );

    this.requireManagerRole(membership);

    // Do not allow projectId, assigneeId or status to change through this
    // endpoint. Assignment and status have their own endpoints and checks.
    if (dto.title !== undefined) {
      task.title = dto.title;
    }

    if (dto.description !== undefined) {
      task.description = dto.description;
    }

    if (dto.priority !== undefined) {
      task.priority = dto.priority;
    }

    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate === null ? null : new Date(dto.dueDate);
    }

    const saved = await this.tasksRepository.save(task);

    return TaskResponseDto.fromEntity(saved);
  }

  /**
   * ASSIGN / UNASSIGN
   * Only OWNERs and ADMINs can change task assignment.
   */
  async assign(
    taskId: string,
    dto: AssignTaskDto,
    requesterId: string,
  ): Promise<TaskResponseDto> {
    const task = await this.findAccessibleTask(taskId, requesterId);

    const membership = await this.requireMembership(
      task.projectId,
      requesterId,
    );

    this.requireManagerRole(membership);

    // Omitted assigneeId means no assignment change was requested.
    if (dto.assigneeId === undefined) {
      throw new BadRequestException(
        'Provide assigneeId, or null to unassign the task.',
      );
    }

    // null explicitly removes the current assignment.
    if (dto.assigneeId === null) {
      task.assignee = null;
      task.assigneeId = null;

      const unassigned = await this.tasksRepository.save(task);

      return TaskResponseDto.fromEntity(unassigned);
    }

    // Confirm the new assignee exists.
    const assignee = await this.usersRepository.findOne({
      where: { id: dto.assigneeId },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found.');
    }

    // Confirm the assignee belongs to the task's project.
    await this.requireMembership(task.projectId, assignee.id);

    task.assignee = assignee;
    task.assigneeId = assignee.id;

    const saved = await this.tasksRepository.save(task);

    return TaskResponseDto.fromEntity(saved);
  }

  /**
   * UPDATE STATUS
   * Any project member except VIEWERs may change task status.
   */
  async updateStatus(
    taskId: string,
    dto: UpdateTaskDto,
    requesterId: string,
  ): Promise<TaskResponseDto> {
    const task = await this.findAccessibleTask(taskId, requesterId);

    const membership = await this.requireMembership(
      task.projectId,
      requesterId,
    );

    if (membership.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot change task status.');
    }

    // status is optional in UpdateTaskDto, so make sure it was sent.
    if (dto.status === undefined) {
      throw new BadRequestException('Provide a status.');
    }

    task.status = dto.status;

    const saved = await this.tasksRepository.save(task);

    return TaskResponseDto.fromEntity(saved);
  }

  /**
   * DELETE
   * Only OWNERs and ADMINs may delete tasks.
   */
  async remove(taskId: string, requesterId: string): Promise<void> {
    const task = await this.findAccessibleTask(taskId, requesterId);

    const membership = await this.requireMembership(
      task.projectId,
      requesterId,
    );

    this.requireManagerRole(membership);

    await this.tasksRepository.remove(task);
  }
}
