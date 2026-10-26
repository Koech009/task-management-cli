import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from './entities/project.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-projects.dto.js';
import { QueryProjectsDto } from './dto/query-projects.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    // Inject the TypeORM repository used to access the projects table.
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

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
  ): Promise<Project> {
    // Build a Project entity from the validated request data.
    const project = this.projectsRepository.create({
      name: createProjectDto.name,
      description: createProjectDto.description ?? null,

      // Associate the project with its creator.
      createdById: userId,
    });

    // Save the new project to MySQL and return the saved record.
    return this.projectsRepository.save(project);
  }

  /**
   * GET ALL PROJECTS
   *
   * Returns only the projects created by the authenticated user.
   * Pagination prevents the API from returning every record at once.
   */
  async findAll(
    userId: string,
    query: QueryProjectsDto,
  ): Promise<{
    data: Project[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
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
      order: {
        createdAt: 'DESC',
        id: 'ASC',
      },
      skip,
      take: limit,
    });

    // Return the results along with pagination metadata.
    return {
      data: projects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * GET ONE PROJECT
   *
   * Finds a project by its ID while checking ownership.
   * A project belonging to another user will not be returned.
   */
  async findOne(projectId: string, userId: string): Promise<Project> {
    // Match both the requested project ID and its creator's ID.
    const project = await this.projectsRepository.findOne({
      where: {
        id: projectId,
        createdById: userId,
      },
    });

    // Return 404 if the project does not exist or belongs to someone else.
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
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
  ): Promise<Project> {
    // Reject an empty update request.
    if (Object.keys(updateProjectDto).length === 0) {
      throw new BadRequestException('Provide at least one field to update.');
    }

    // Check existence and ownership before making changes.
    const project = await this.findOne(projectId, userId);

    // Apply only the fields supplied by the client.
    // Never update createdById using request-body data.
    if (updateProjectDto.name !== undefined) {
      project.name = updateProjectDto.name;
    }

    if (updateProjectDto.description !== undefined) {
      project.description = updateProjectDto.description;
    }

    // Persist the updated project.
    return this.projectsRepository.save(project);
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
    const project = await this.findOne(projectId, userId);

    // Remove the verified project from the database.
    await this.projectsRepository.remove(project);

    // Return a simple confirmation for the API response.
    return {
      message: 'Project deleted successfully.',
    };
  }
}
