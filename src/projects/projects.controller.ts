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
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ALL_PROJECT_ROLES } from './constants/project-permissions.constant.js';
import { ProjectRoles } from './decorators/project-roles.decorator.js';
import { ProjectRole } from '../common/enums/project-role.enum.js';
import { ProjectRolesGuard } from './guards/project-roles.guard.js';

// Describes the authenticated user object provided by your JWT strategy.
// Adjust this interface if your existing strategy uses a different shape.
interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

// Every endpoint requires a valid access token.
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard, ProjectRolesGuard) //protect every route
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
  @ProjectRoles(...ALL_PROJECT_ROLES)
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
  @ProjectRoles(...ALL_PROJECT_ROLES)
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
  @ProjectRoles(ProjectRole.OWNER)
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
  @ProjectRoles(ProjectRole.OWNER)
  @Roles(UserRole.ADMIN)
  remove(
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.remove(projectId, user.id);
  }
}
