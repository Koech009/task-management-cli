import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { Project } from './entities/project.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { ProjectMember } from './entities/project-member.entity.js';
import { ProjectMembersService } from './project-members/project-members.service.js';
import { User } from '../users/entities/user.entity.js';
import { ProjectMembersController } from './project-members/project-members.controller.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Project, ProjectMember, User]),
  ],
  controllers: [ProjectsController, ProjectMembersController],
  providers: [ProjectsService, ProjectMembersService],
})
export class ProjectsModule {}
