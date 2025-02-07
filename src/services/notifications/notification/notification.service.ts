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
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  NotificationDeliveryTypes,
  PRIORITY_TYPES,
} from 'src/app/types/app.types';
import { v4 as uuid } from 'uuid';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { In } from 'typeorm';
import { NotificationRecipient } from 'src/entities/core/notificationrecipient.entity';
import { NotificationTypes } from '@notifier/rtechnotifier/types/enums';

const PRIORITY_ORDER: Record<PRIORITY_TYPES, number> = {
  [PRIORITY_TYPES.HIGH]: 3,
  [PRIORITY_TYPES.MEDIUM]: 2,
  [PRIORITY_TYPES.LOW]: 1,
};

const sortByPriority = (
  a: { priority: PRIORITY_TYPES },
  b: { priority: PRIORITY_TYPES },
) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];

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
        if (data.payload.to?.length <= 0) {
          throw new RpcException('No email number provided');
        }
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
    const response = this.io.emit(
      NOTIFICATION_PATTERN.SYSTEM_NOTIFICATION,
      payload,
    );
    return response as IoClient<DefaultEventsMap, DefaultEventsMap>;
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
      if (data.recipient?.length <= 0) {
        return new BadRequestException('No recipients provided');
      }
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

  async getUserSystemNotifications(recipient: string) {
    try {
      const response = await this.recipient.repository.find({
        where: {
          recipientHash: this.Hash(recipient),
          status: In([
            NOTIFICATION_STATUS.SENT,
            NOTIFICATION_STATUS.RECIEVED,
            NOTIFICATION_STATUS.READ,
          ]),
        },
      });
      if (response.length > 0) {
        const resenddata: RTechSystemNotificationType[] = [];
        for (const item of response) {
          const data = this.HandleBuildData(item);
          resenddata.push(data);
        }
        const uploads = resenddata
          .filter((data) => data.type === NotificationTypes.UPLOAD)
          .sort(sortByPriority);
        const other = resenddata
          .filter(
            (data) =>
              data.type !== NotificationTypes.UPLOAD &&
              data.type !== NotificationTypes.ANNOUNCEMENT,
          )
          .sort(sortByPriority);

        const announcements = resenddata
          .filter((data) => data.type !== NotificationTypes.ANNOUNCEMENT)
          .sort(sortByPriority);
        return {
          uploads: uploads,
          announcements: announcements,
          other: other,
        };
      }

      return { uploads: [], announcements: [], other: [] };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  private HandleBuildData(
    recipient: NotificationRecipient,
  ): RTechSystemNotificationType {
    const media = this.body.HandleMediasRebuild(recipient.notification.body);
    const meta = this.body.HandleMetaRebuild(recipient.notification.body);
    const data: RTechSystemNotificationType = {
      recipient: {
        type: 'no broadcast',
        recipients: [{ to: recipient.recipient }],
      },
      data: {
        message: recipient.notification.body.message,
        title: recipient.notification.body.title,
        timestamp: recipient.notification.body.timestamp,
        mediaUrl: media,
        meta,
      },
      pattern: recipient.notification.pattern,
      priority: recipient.notification.priority,
      link: recipient.notification.link,
      type: recipient.notification.notificationType,
      resendId: recipient.notification.id,
    };
    return data;
  }
}
