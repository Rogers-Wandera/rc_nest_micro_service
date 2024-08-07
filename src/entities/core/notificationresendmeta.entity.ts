import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntityClass } from '../base.entity';
import { NotificationResendBody } from './notificationresendbody.entity';

@Entity({ name: 'notificationresendmetas' })
export class NotificationResendMeta extends BaseEntityClass {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => NotificationResendBody, (body) => body.meta, {
    nullable: false,
  })
  @JoinColumn({ name: 'bodyId' })
  body: NotificationResendBody;
  @Column({ nullable: false, type: 'varchar', length: 100 })
  name: string;
  @Column({ nullable: false, type: 'text' })
  value: string | number | Boolean | Date;
}
