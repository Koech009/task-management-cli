import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Project } from './entities/project.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-projects.dto.js';
import { QueryProjectsDto } from './dto/query-projects.dto.js';
import { ProjectResponseDto } from './dto/project-response.dto.js';
import { ProjectMember } from './entities/project-member.entity.js';
import { ProjectRole } from '../common/enums/project-role.enum.js';

@Injectable()
export class ProjectsService {
  constructor(
    // Inject the TypeORM repository used to access the projects table.
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,

    private readonly dataSource: DataSource,
  ) {}

  // Relations needed to build a ProjectResponseDto.
  private readonly projectRelations = { createdBy: true };

  /**
   * Finds a project owned by the user, with the creator loaded.
   * Returns 404 if the project does not exist or belongs to someone else.
   * Used internally so update/remove can work with the entity.
   */
  private async findOwnedProject(
    projectId: string,
    userId: string,
  ): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: {
        id: projectId,
        createdById: userId,
      },
      relations: this.projectRelations,
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  /**
   * CREATE PROJECT
   *
   * Creates a project and assigns it to the authenticated user.
   *
   * The userId must come from the verified JWT user in the controller,
   * never from the request body.
   */
  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    // Start a database transaction.
    return this.dataSource.transaction(async (manager) => {
      // Create the project using the transaction's repository.
      const projectRepository = manager.getRepository(Project);

      const project = projectRepository.create({
        name: createProjectDto.name,
        description: createProjectDto.description ?? null,
        createdById: userId,
      });

      // Save the project.
      const savedProject = await projectRepository.save(project);

      // Create a membership record for the project creator.
      const projectMemberRepository = manager.getRepository(ProjectMember);

      const ownerMembership = projectMemberRepository.create({
        projectId: savedProject.id,
        userId,
        role: ProjectRole.OWNER,
      });

      // Save the owner membership in the same transaction.
      await projectMemberRepository.save(ownerMembership);

      // Reload the project with its creator relation.
      const createdProject = await projectRepository.findOneOrFail({
        where: { id: savedProject.id },
        relations: this.projectRelations,
      });

      return ProjectResponseDto.fromEntity(createdProject);
    });
  }
  /**
   * GET ALL PROJECTS
   *
   * Returns only the projects created by the authenticated user.
   * Pagination prevents the API from returning every record at once.
   */
  async findAll(userId: string, query: QueryProjectsDto) {
    // Use default values when the client omits pagination parameters.
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // Reject invalid values even if the service is called without
    // the expected DTO validation pipeline.
    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      throw new BadRequestException(
        'Page must be a positive integer and limit must be between 1 and 100.',
      );
    }

    // Calculate how many records should be skipped.
    const skip = (page - 1) * limit;

    // Find this user's projects and count all matching projects.
    const [projects, total] = await this.projectsRepository.findAndCount({
      where: {
        createdById: userId,
      },
      relations: this.projectRelations,
      order: {
        createdAt: 'DESC',
        id: 'ASC',
      },
      skip,
      take: limit,
    });

    // Return the mapped results along with pagination metadata.
    return {
      data: projects.map((project) => ProjectResponseDto.fromEntity(project)),
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
   * GET ONE PROJECT
   *
   * Finds a project by its ID while checking ownership.
   * A project belonging to another user will not be returned.
   */
  async findOne(
    projectId: string,
    userId: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.findOwnedProject(projectId, userId);

    return ProjectResponseDto.fromEntity(project);
  }

  /**
   * UPDATE PROJECT
   *
   * Updates only a project owned by the authenticated user.
   */
  async update(
    projectId: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<ProjectResponseDto> {
    // Reject an empty update request.
    if (Object.keys(updateProjectDto).length === 0) {
      throw new BadRequestException('Provide at least one field to update.');
    }

    // Check existence and ownership before making changes.
    const project = await this.findOwnedProject(projectId, userId);

    // Apply only the fields supplied by the client.
    // Never update createdById using request-body data.
    if (updateProjectDto.name !== undefined) {
      project.name = updateProjectDto.name;
    }

    if (updateProjectDto.description !== undefined) {
      project.description = updateProjectDto.description;
    }

    // Persist the updated project. createdBy is already loaded.
    const saved = await this.projectsRepository.save(project);

    return ProjectResponseDto.fromEntity(saved);
  }

  /**
   * DELETE PROJECT
   *
   * Deletes only a project owned by the authenticated user.
   */
  async remove(
    projectId: string,
    userId: string,
  ): Promise<{ message: string }> {
    // Verify ownership before deleting anything.
    const project = await this.findOwnedProject(projectId, userId);

    // Remove the verified project from the database.
    await this.projectsRepository.remove(project);

    // Return a simple confirmation for the API response.
    return {
      message: 'Project deleted successfully.',
    };
  }
}
