import { Column, Entity, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { NOTIFICATION_PATTERN } from 'src/app/patterns/notification.patterns';
import {
  NOTIFICATION_RESEND_STATUS,
  NOTIFICATION_TYPE,
  PRIORITY_TYPES,
} from 'src/app/types/app.types';
import { BaseEntityClass } from '../base.entity';
import { NotificationResendBody } from './notificationresendbody.entity';
import { NotificationResendRecipients } from './notificationresendrecipient.entity';
import { NotificationTypes } from '@notifier/rtechnotifier/types/enums';

@Entity({ name: 'notificationresends' })
export class NotificationResend extends BaseEntityClass {
  @PrimaryColumn({ type: 'varchar', length: 200, nullable: false })
  id: string;
  @Column({ type: 'enum', enum: NOTIFICATION_TYPE, nullable: false })
  type: NOTIFICATION_TYPE;
  @Column({
    type: 'enum',
    enum: NOTIFICATION_RESEND_STATUS,
    nullable: false,
    default: NOTIFICATION_RESEND_STATUS.PENDING,
  })
  status: NOTIFICATION_RESEND_STATUS;
  @Column({
    type: 'enum',
    enum: NotificationTypes,
    nullable: false,
    default: NotificationTypes.INFO,
  })
  notificationType: NotificationTypes;
  @Column({ type: 'enum', enum: PRIORITY_TYPES, nullable: false })
  priority: PRIORITY_TYPES;
  @Column({ type: 'int', nullable: false })
  recipientCount: number;
  @Column({ type: 'int', nullable: false, default: 0 })
  resendCount: number;
  @Column({ type: 'varchar', length: 150, nullable: true })
  link: string;
  @Column({ type: 'varchar', length: 50, nullable: false })
  pattern: NOTIFICATION_PATTERN;
  @Column({ type: 'enum', enum: NOTIFICATION_PATTERN, nullable: false })
  command: NOTIFICATION_PATTERN;
  @OneToOne(() => NotificationResendBody, (body) => body.notification, {
    eager: true,
  })
  body: NotificationResendBody;
  @OneToMany(
    () => NotificationResendRecipients,
    (recipients) => recipients.notification,
  )
  recipients: NotificationResendRecipients[];
}
