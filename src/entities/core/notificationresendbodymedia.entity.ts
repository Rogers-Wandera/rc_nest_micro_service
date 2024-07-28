import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntityClass } from '../base.entity';
import { NotificationResendBody } from './notificationresendbody.entity';
import { MediaTypes } from 'src/app/types/app.types';

@Entity({ name: 'notificationresendmedias' })
export class NotificationResendMedia extends BaseEntityClass {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => NotificationResendBody, (body) => body.media, {
    nullable: false,
  })
  @JoinColumn({ name: 'bodyId' })
  body: NotificationResendBody;
  @Column({ nullable: false, type: 'varchar', length: 200 })
  url: string;
  @Column({ nullable: false, type: 'enum', enum: MediaTypes })
  type: MediaTypes;
}
