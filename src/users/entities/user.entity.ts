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
import { Task } from '../../tasks/entities/task.entity.js';
// import { Exclude } from 'class-transformer';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
@Entity('users')
export class User {
  @Expose()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose()
  @Column({
    type: 'varchar',
    length: 100,
  })
  name: string;
  @Expose()
  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email: string;

  @Exclude()
  @Column({
    type: 'varchar',
    select: false,
  })
  passwordHash: string;
  @Expose()
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;
  @Expose()
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

  // Tasks created by this user.
  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Relation<Task[]>;

  // Tasks assigned to this user.
  @OneToMany(() => Task, (task) => task.assignee)
  assignedTasks: Relation<Task[]>;
  @Expose()
  @CreateDateColumn()
  createdAt: Date;
  @Expose()
  @UpdateDateColumn()
  updatedAt: Date;
}
