import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NOTIFICATION_PATTERN } from 'src/app/patterns/notification.patterns';
import {
  NOTIFICATION_RESEND_STATUS,
  NOTIFICATION_TYPE,
  PRIORITY_TYPES,
} from 'src/app/types/app.types';
import { BaseEntityClass } from '../base.entity';
import { NotificationResendBody } from './notificationresendbody.entity';
import { NotificationResendRecipients } from './notificationresendrecipient.entity';

@Entity({ name: 'notificationresends' })
export class NotificationResend extends BaseEntityClass {
  @PrimaryGeneratedColumn('uuid')
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
  @Column({ type: 'enum', enum: PRIORITY_TYPES, nullable: false })
  priority: PRIORITY_TYPES;
  @Column({ type: 'int', nullable: false })
  recipientCount: number;
  @Column({ type: 'varchar', length: 150, nullable: true })
  link: string;
  @Column({ type: 'varchar', length: 50, nullable: false })
  pattern: NOTIFICATION_PATTERN;
  @OneToOne(() => NotificationResendBody, (body) => body.notification, {
    eager: true,
  })
  body: NotificationResendBody;
  @OneToMany(
    () => NotificationResendRecipients,
    (recipients) => recipients.notification,
    { eager: true },
  )
  recipients: NotificationResendRecipients[];
}
