import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntityClass } from '../base.entity';
import { NotificationResend } from './notificationresend.entity';
import { NotificationResendMedia } from './notificationresendbodymedia.entity';
import { NotificationResendMeta } from './notificationresendmeta.entity';

@Entity({ name: 'notificationresendbody' })
export class NotificationResendBody extends BaseEntityClass {
  @PrimaryGeneratedColumn()
  id: number;
  @OneToOne(() => NotificationResend, (notification) => notification.body, {
    nullable: false,
  })
  @JoinColumn({ name: 'resendId' })
  notification: NotificationResend;
  @Column({ nullable: false, type: 'varchar', length: 100 })
  title: string;
  @Column({ nullable: false, type: 'text' })
  message: string;
  @Column({ nullable: false, type: 'datetime' })
  timestamp: Date;
  @OneToMany(
    () => NotificationResendMedia,
    (notification) => notification.body,
    { eager: true },
  )
  media: NotificationResendMedia[];
  @OneToMany(
    () => NotificationResendMeta,
    (notification) => notification.body,
    { eager: true },
  )
  meta: NotificationResendMeta[];
}
