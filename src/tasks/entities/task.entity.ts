import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { Project } from '../../projects/entities/project.entity.js';
import { User } from '../../users/entities/user.entity.js';

import { TaskStatus } from '../../common/enums/task-status.enum.js';
import { TaskPriority } from '../../common/enums/task-priority.enum.js';

@Entity('tasks')
export class Task {
  // Generates a unique UUID for every task.
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // A short title describing the work to be done.
  @Column({ type: 'varchar', length: 200 })
  title: string;

  // A longer description explaining the task.
  // It can be null when no description is provided.
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Tracks the task's progress.
  // New tasks start in the TODO state.
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  // Indicates the importance of the task.
  // MEDIUM is the default priority.
  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  // The project to which this task belongs.
  // Deleting the project also deletes its tasks.
  @ManyToOne(() => Project, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Relation<Project>;

  // Stores the foreign key of the related project.
  @Column({ type: 'varchar', length: 36 })
  projectId: string;

  // The user who created the task.
  // The task cannot be created without a creator.
  // RESTRICT prevents deleting a user who created tasks.
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'createdById' })
  createdBy: Relation<User>;

  // Stores the creator's user ID.
  @Column({ type: 'varchar', length: 36 })
  createdById: string;

  // The user responsible for completing the task.
  // A task can exist without an assignee.
  // If the assignee is deleted, this relationship becomes null.
  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assigneeId' })
  assignee: Relation<User> | null;

  // The assigned user's ID, or null if nobody is assigned.
  @Column({ type: 'varchar', length: 36, nullable: true })
  assigneeId: string | null;

  // Optional deadline for completing the task.
  @Column({ type: 'datetime', nullable: true })
  dueDate: Date | null;

  // Automatically records when the task is created.
  @CreateDateColumn()
  createdAt: Date;

  // Automatically updates when the task is saved with changes.
  @UpdateDateColumn()
  updatedAt: Date;
}
