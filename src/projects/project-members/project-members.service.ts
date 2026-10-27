import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from '../entities/project.entity.js';
import { ProjectMember } from '../entities/project-member.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { ProjectRole } from '../../common/enums/project-role.enum.js';

@Injectable()
export class ProjectMembersService {
  constructor(
    // Repository for creating, finding, and updating project memberships.
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,

    // Repository for checking whether a project exists.
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    // Repository for checking whether the user being added exists.
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Add an existing user to a project.
  //
  // projectId: the project receiving the new member.
  // userId: the user who will be added.
  // requesterId: the authenticated user making the request.
  // role: the role assigned to the new member; defaults to MEMBER.
  async addMember(
    projectId: string,
    userId: string,
    requesterId: string,
    role: ProjectRole = ProjectRole.MEMBER,
  ): Promise<ProjectMember> {
    // 1. Check that the project exists.
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // 2. Find the requester's membership in this project.
    // This lets us check the requester's project-specific role.
    const requesterMembership = await this.projectMemberRepository.findOne({
      where: {
        projectId,
        userId: requesterId,
      },
    });

    // The creator is treated as the owner for authorization purposes.
    const isCreator = project.createdById === requesterId;

    // Owners and admins are allowed to add regular members or viewers.
    const isAuthorizedAdmin =
      requesterMembership?.role === ProjectRole.OWNER ||
      requesterMembership?.role === ProjectRole.ADMIN;

    // Reject the request if the requester has insufficient permissions.
    if (!isCreator && !isAuthorizedAdmin) {
      throw new ForbiddenException(
        'Only the project owner or an admin can add members.',
      );
    }

    // 3. Check that the target user has an account.
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User to add was not found.');
    }

    // 4. Prevent the same user from joining the same project twice.
    const existingMembership = await this.projectMemberRepository.findOne({
      where: {
        projectId,
        userId,
      },
    });

    if (existingMembership) {
      throw new ConflictException(
        'This user is already a member of the project.',
      );
    }

    // 5. Create the membership record.
    // The DTO should restrict this operation to MEMBER or VIEWER.
    const membership = this.projectMemberRepository.create({
      projectId,
      userId,
      role,
    });

    // 6. Save the new membership in the database.
    return this.projectMemberRepository.save(membership);
  }

  // Promote an existing project member to ADMIN.
  //
  // Only the project owner may promote another member.
  async assignAdmin(
    projectId: string,
    targetUserId: string,
    requesterId: string,
  ): Promise<ProjectMember> {
    // 1. Confirm that the project exists.
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // 2. Retrieve the requester's membership and role.
    const requesterMembership = await this.projectMemberRepository.findOne({
      where: {
        projectId,
        userId: requesterId,
      },
    });

    // The project creator is also recognized as the owner.
    const isOwner =
      project.createdById === requesterId ||
      requesterMembership?.role === ProjectRole.OWNER;

    // Admins cannot promote other members to admin.
    if (!isOwner) {
      throw new ForbiddenException(
        'Only the project owner can assign the ADMIN role.',
      );
    }

    // 3. Find the user who should be promoted.
    // They must already belong to this project.
    const membership = await this.projectMemberRepository.findOne({
      where: {
        projectId,
        userId: targetUserId,
      },
    });

    if (!membership) {
      throw new NotFoundException('This user is not a member of the project.');
    }

    // 4. Do not change the owner's role through this endpoint.
    // Ownership changes should use a separate, carefully controlled workflow.
    if (membership.role === ProjectRole.OWNER) {
      throw new ConflictException(
        'The project owner cannot be changed through this endpoint.',
      );
    }

    // 5. Avoid performing a redundant update.
    if (membership.role === ProjectRole.ADMIN) {
      throw new ConflictException('This user is already a project admin.');
    }

    // 6. Promote the member to ADMIN.
    membership.role = ProjectRole.ADMIN;

    // 7. Persist the updated role in the database.
    return this.projectMemberRepository.save(membership);
  }
}
