import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntityClass } from '../base.entity';
import { Notification } from './notification.entity';
import { NotificationMeta } from './notificationmeta.entity';
import { NotificationMedia } from './notificationmedia.entity';

@Entity({ name: 'notificationbody' })
export class NotificationBody extends BaseEntityClass {
  @PrimaryGeneratedColumn()
  id: number;
  @OneToOne(() => Notification, (notification) => notification.body, {
    nullable: false,
  })
  @JoinColumn()
  notification: Notification;
  @Column({ nullable: false, type: 'varchar', length: 100 })
  title: string;
  @Column({ nullable: false, type: 'text' })
  message: string;
  @Column({ nullable: false, type: 'datetime' })
  timestamp: Date;
  @OneToMany(() => NotificationMedia, (notification) => notification.body, {
    eager: true,
  })
  media: NotificationMedia[];
  @OneToMany(() => NotificationMeta, (notification) => notification.body, {
    eager: true,
  })
  meta: NotificationMeta[];
}
