import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ProjectsService } from './projects.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-projects.dto.js';
import { QueryProjectsDto } from './dto/query-projects.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

// Describes the authenticated user object provided by your JWT strategy.
// Adjust this interface if your existing strategy uses a different shape.
interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

// Every endpoint requires a valid access token.
@Controller('projects')
@UseGuards(JwtAuthGuard) //protect every route
export class ProjectsController {
  constructor(
    // Inject the service containing our project business logic.
    private readonly projectsService: ProjectsService,
  ) {}

  /**
   * CREATE PROJECT
   * POST /projects
   *
   * The creator's ID comes from the authenticated JWT user,
   * not from the request body.
   */
  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser, //get current user from jwt
  ) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  /**
   * GET MY PROJECTS
   * GET /projects?page=1&limit=10
   *
   * Returns only projects belonging to the current user.
   */
  @Get()
  findAll(
    @Query() query: QueryProjectsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.findAll(user.id, query);
  }

  /**
   * GET ONE PROJECT
   * GET /projects/:projectId
   *
   * ParseUUIDPipe rejects malformed project IDs.
   */
  @Get(':projectId')
  findOne(
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.findOne(projectId, user.id);
  }

  /**
   * UPDATE PROJECT
   * PATCH /projects/:projectId
   *
   * Only the project's creator can update it.
   */
  @Patch(':projectId')
  update(
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.update(projectId, updateProjectDto, user.id);
  }

  /**
   * DELETE PROJECT
   * DELETE /projects/:projectId
   *
   * Only the project's creator can delete it.
   */
  @Delete(':projectId')
  remove(
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.remove(projectId, user.id);
  }
}
