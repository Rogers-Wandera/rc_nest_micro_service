import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntityClass {
  @CreateDateColumn({
    type: 'datetime',
  })
  creationDate: Date;
  @Column({ nullable: false })
  createdBy: string;
  @UpdateDateColumn({
    type: 'datetime',
  })
  updateDate: Date;
  @Column({ nullable: true })
  updatedBy: string;
  @DeleteDateColumn({
    type: 'datetime',
    name: 'deleted_at',
  })
  deletedAt: Date;
  @Column({ nullable: true })
  deletedBy: string;
  @Column({ default: 1, type: 'int', width: 1 })
  isActive: number;
}
