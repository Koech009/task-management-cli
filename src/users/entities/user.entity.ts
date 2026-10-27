import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { UserRole } from '../../common/enums/user-role.enum.js';
import { RefreshSessionEntity } from './refresh-session.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { ProjectMember } from '../../projects/entities/project-member.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email: string;

  @Column({
    type: 'varchar',
    select: false,
  })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'boolean',
    default: false,
  })
  isEmailVerified: boolean;

  @OneToMany(
    () => RefreshSessionEntity,
    (refreshSession) => refreshSession.user,
  )
  refreshSessions: Relation<RefreshSessionEntity[]>;

  @OneToMany(() => Project, (project) => project.createdBy)
  createdProjects: Relation<Project[]>;

  @OneToMany(() => ProjectMember, (projectMember) => projectMember.user)
  projectMemberships: Relation<ProjectMember[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
