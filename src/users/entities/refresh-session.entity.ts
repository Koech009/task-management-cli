
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

import { User } from './user.entity.js';

@Entity('refresh_sessions')
@Index(['familyId'])
export class RefreshSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  tokenHash: string;

  @ManyToOne(
    () => User,
    (user) => user.refreshSessions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 36 })
  familyId: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'datetime', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  replacedBySessionId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
