import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntityClass } from '../base.entity';
import { NOTIFICATION_STATUS, PRIORITY_TYPES } from 'src/app/types/app.types';
import { Notification } from './notification.entity';

@Entity({ name: 'notificationrecipients' })
export class NotificationRecipient extends BaseEntityClass {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  recipient: string;
  @ManyToOne(() => Notification, (notification) => notification.recipients, {
    nullable: false,
    eager: true,
  })
  @JoinColumn()
  notification: Notification;
  @Column({ type: 'enum', enum: PRIORITY_TYPES, nullable: false })
  priority: PRIORITY_TYPES;
  @Column({
    nullable: false,
    type: 'enum',
    enum: NOTIFICATION_STATUS,
    default: NOTIFICATION_STATUS.SENT,
  })
  status: NOTIFICATION_STATUS;
}
