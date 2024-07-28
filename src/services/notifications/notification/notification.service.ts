import { Injectable } from '@nestjs/common';
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

@Injectable()
export class NotificationService extends EntityModel<Notification> {
  constructor(
    private readonly rtechservices: RTechNotifier,
    @InjectIoClientProvider()
    private readonly io: IoClient,
    datasource: EntityDataSource,
  ) {
    super(Notification, datasource);
  }

  async sendNotification(data: NotificationOptions) {
    try {
      if (data.type === 'sms') {
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
}
