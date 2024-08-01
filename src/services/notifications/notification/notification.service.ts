import { BadRequestException, Injectable, Scope } from '@nestjs/common';
import { RTechNotifier } from '@notifier/rtechnotifier';
import {
  NotificationOptions,
  RTechSystemNotificationType,
} from '@notifier/rtechnotifier/types/notify.types';
import { InjectIoClientProvider, IoClient } from 'nestjs-io-client';
import { NOTIFICATION_PATTERN } from 'src/app/patterns/notification.patterns';
import { Notification } from 'src/entities/core/notification.entity';
import { EntityDataSource } from 'src/model/enity.data.model';
import { EntityModel } from 'src/model/entity.model';
import { NotificationData } from './notification.type';
import { NotificationBodyService } from './notificationbody.service';
import { NotificationRecipientService } from './notificationrecipient.service';
import { RpcException } from '@nestjs/microservices';
import {
  NOTIFICATION_TYPE,
  NotificationDeliveryTypes,
} from 'src/app/types/app.types';
import { v4 as uuid } from 'uuid';

@Injectable({ scope: Scope.TRANSIENT })
export class NotificationService extends EntityModel<Notification> {
  constructor(
    private readonly rtechservices: RTechNotifier,
    @InjectIoClientProvider()
    private readonly io: IoClient,
    datasource: EntityDataSource,
    private readonly body: NotificationBodyService,
    private readonly recipient: NotificationRecipientService,
  ) {
    super(Notification, datasource);
  }
  private generateId() {
    this.entity.id = uuid();
  }
  async sendNotification(data: NotificationOptions) {
    try {
      if (data.type === 'sms') {
        if (data.payload.message.to.length <= 0) {
          throw new RpcException('No phone number provided');
        }
        this.rtechservices.smsoptions = data.payload;
      } else if (data.type === 'email') {
        this.rtechservices.mailoptions = data.payload;
      } else {
        this.rtechservices.pushoptions = data.payload;
      }
      const response = await this.rtechservices.notification(data.type);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async SendEventMessage(payload: RTechSystemNotificationType) {
    return this.io.emit(NOTIFICATION_PATTERN.SYSTEM_NOTIFICATION, payload);
  }

  async SaveSystemNotification(data: NotificationData) {
    try {
      this.entity.pattern = data.pattern;
      this.entity.priority = data.priority;
      this.entity.type = data.type;
      this.entity.command = data.command;
      this.entity.notificationType = data.notificationType;
      this.entity.link = data.link;
      this.entity.createdBy = data.createdBy;
      this.entity.updatedBy = data.createdBy;
      this.entity.recipientCount = Array.isArray(data.recipient)
        ? data.recipient.length
        : 1;
      if (this.entity.type === NOTIFICATION_TYPE.EMAIL) {
        this.entity.deliveryType = NotificationDeliveryTypes.EMAIL_DELIVERY;
      } else if (this.entity.type === NOTIFICATION_TYPE.SMS) {
        this.entity.deliveryType = NotificationDeliveryTypes.SMS_DELIVERY;
      } else {
        this.entity.deliveryType = NotificationDeliveryTypes.PUSH_DELIVERY;
      }
      this.generateId();
      const response = await this.repository.save(this.entity);
      this.body.entity.createdBy = data.createdBy;
      this.recipient.entity.createdBy = data.createdBy;
      this.body.entity.notification = response;

      this.recipient.entity.notification = response;
      await this.body.CreateBody({
        timestamp: data.data.timestamp,
        title: data.data.title,
        message: data.data.message,
        media: data.data.mediaUrl,
        meta: data.data.meta,
      });
      await this.recipient.CreateRecipient(data.recipient);
      return response;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
