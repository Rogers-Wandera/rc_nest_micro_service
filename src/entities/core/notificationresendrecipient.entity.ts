import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntityClass } from '../base.entity';
import { NotificationResend } from './notificationresend.entity';
import { NOTIFICATION_RESEND_STATUS } from 'src/app/types/app.types';

@Entity({ name: 'notificationresendrecipients' })
export class NotificationResendRecipients extends BaseEntityClass {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  recipient: string;
  @ManyToOne(
    () => NotificationResend,
    (notification) => notification.recipients,
    { nullable: false, eager: true },
  )
  @JoinColumn({ name: 'resendId' })
  notification: NotificationResend;
  @Column({
    nullable: false,
    type: 'enum',
    enum: NOTIFICATION_RESEND_STATUS,
    default: NOTIFICATION_RESEND_STATUS.PENDING,
  })
  status: NOTIFICATION_RESEND_STATUS;
  @Column({
    nullable: false,
    type: 'int',
    default: 0,
  })
  retries: number;
}
