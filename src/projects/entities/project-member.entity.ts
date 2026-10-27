import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { Project } from './project.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { ProjectRole } from '../../common/enums/project-role.enum.js';

@Entity('project_members')
@Index(['projectId', 'userId'], { unique: true })
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Relation<Project>;

  @Column({ type: 'varchar', length: 36 })
  projectId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({
    type: 'enum',
    enum: ProjectRole,
    default: ProjectRole.MEMBER,
  })
  role: ProjectRole;

  @CreateDateColumn()
  joinedAt: Date;
}
