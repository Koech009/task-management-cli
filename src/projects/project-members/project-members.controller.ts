import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { ProjectMembersService } from './project-members.service.js';
import { AddProjectMemberDto } from '../dto/add-project-member.dto.js';
import { AssignProjectAdminDto } from '../dto/assign-project-admin.dto.js';
import { ProjectRole } from '../../common/enums/project-role.enum.js';

// Extend Express's Request type to describe the authenticated user.
// JwtStrategy should attach the user's information to req.user.
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

// The JWT guard requires the requester to be authenticated
// before accessing any endpoint in this controller.
@Controller('projects/:projectId/members')
@UseGuards(AuthGuard('jwt'))
export class ProjectMembersController {
  constructor(
    // Inject the service containing the membership business logic.
    private readonly projectMembersService: ProjectMembersService,
  ) {}

  // POST /projects/:projectId/members
  // Adds an existing user to a project as a MEMBER or VIEWER.
  // The service checks whether the requester has permission.
  @Post()
  addMember(
    // Read the project ID from the URL and validate that it is a UUID.
    @Param('projectId', ParseUUIDPipe) projectId: string,

    // Validate the request body using AddProjectMemberDto.
    @Body() dto: AddProjectMemberDto,

    // Access the authenticated user's ID from the JWT strategy.
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectMembersService.addMember(
      projectId,
      dto.userId,
      req.user.id,
      dto.role ?? ProjectRole.MEMBER,
    );
  }

  // PATCH /projects/:projectId/members/:userId/role
  // Promotes an existing project member to ADMIN.
  // Only the project owner can perform this operation.
  @Patch(':userId/role')
  assignAdmin(
    // Identify the project whose membership is being changed.
    @Param('projectId', ParseUUIDPipe) projectId: string,

    // Identify the existing member who should become an admin.
    @Param('userId', ParseUUIDPipe) targetUserId: string,

    // Validate the submitted role. The DTO should allow ADMIN only.
    @Body() dto: AssignProjectAdminDto,

    // Identify the person making the request.
    @Req() req: AuthenticatedRequest,
  ) {
    // Use the validated role explicitly so that this endpoint
    // cannot accidentally assign a different role.
    if (dto.role !== ProjectRole.ADMIN) {
      throw new Error('This endpoint only supports assigning the ADMIN role.');
    }

    return this.projectMembersService.assignAdmin(
      projectId,
      targetUserId,
      req.user.id,
    );
  }
}
