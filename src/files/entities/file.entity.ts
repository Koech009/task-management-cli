import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  originalName: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  filename: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  mimeType: string;

  @Column({
    type: 'int',
    unsigned: true,
  })
  size: number;

  @Column({
    type: 'varchar',
    length: 500,
  })
  storagePath: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'uploadedById',
  })
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
