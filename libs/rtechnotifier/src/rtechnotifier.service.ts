import { BadRequestException, Injectable } from '@nestjs/common';
import { RTECHEmailService } from './mailer/mailer.service';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { RTECHPushNotificationService } from './pushnotification/push.service';
import {
  PushOptions,
  RTechSendOptions,
  RTechSmsMessage,
  RTechSmsTypes,
} from './types/notify.types';
import { RTechSmsService } from './smsnotification/sms.service';
import { EnvConfig } from 'src/app/configs/envconfigs';
import { NotificationData } from 'src/services/notifications/notification/notification.type';
import { NOTIFICATION_TYPE, PRIORITY_TYPES } from 'src/app/types/app.types';
import { NotificationTypes } from './types/enums';

@Injectable()
export class RTechNotifier {
  public mailoptions: RTechSendOptions | null;
  public company: string;
  public pushoptions: PushOptions | null;
  public smsoptions: {
    provider: RTechSmsTypes;
    message: RTechSmsMessage;
  } | null;
  constructor(
    private emailservice: RTECHEmailService,
    private configService: ConfigService<EnvConfig>,
    private pushservice: RTECHPushNotificationService,
    private smsservice: RTechSmsService,
  ) {
    this.mailoptions = null;
    this.company = this.configService.get('company');
    this.pushoptions = null;
    this.smsoptions = null;
  }
  async notification(type: 'email' | 'sms' | 'push') {
    this.emailservice.company = this.company;
    const data = this.NotificationSendData(type);
    switch (type) {
      case 'email':
        if (!this.mailoptions)
          throw new BadRequestException('Mail options are required');
        await this.emailservice.SendEmail({ ...this.mailoptions });
        return { message: 'Email sent successfully', data };
      case 'push':
        if (!this.pushoptions)
          throw new BadRequestException('Push options are required');
        if (this.pushoptions.type === 'notopic') {
          await this.pushservice.sendMessage(this.pushoptions.payload);
        } else if (this.pushoptions.type === 'topic') {
          await this.pushservice.sendToTopic(
            this.pushoptions.type,
            this.pushoptions.payload,
          );
        } else if (this.pushoptions.type === 'multicast') {
          await this.pushservice.sendMultiCast(this.pushoptions.payload);
        } else if (this.pushoptions.type === 'system') {
          await this.pushservice.sendSystemNotification(
            this.pushoptions.payload,
          );
        } else {
          throw new BadRequestException(
            'The requested push type is not supported',
          );
        }
        return { message: 'Push Notification sent successfully', data };
      case 'sms':
        if (!this.smsoptions)
          throw new BadRequestException('Sms options are required');
        this.smsservice.type = this.smsoptions.provider;
        const response = await this.smsservice.sendMessage(
          this.smsoptions.message,
        );
        if (typeof response === 'string') {
          return { message: response, data };
        }
        return { message: 'Sms sent successfully', data };
      default:
        throw new BadRequestException(
          'Notification type not supported at the moment',
        );
    }
  }

  private NotificationSendData(type: 'email' | 'sms' | 'push') {
    const data: NotificationData = {
      data: {},
    } as NotificationData;

    switch (type) {
      case 'email':
        if (this.mailoptions) {
          data.type = NOTIFICATION_TYPE.EMAIL;
          data.recipient = this.mailoptions.to;
          data.data.message = this.mailoptions.context.body;
          data.data.title = this.mailoptions.subject;
          data.data.timestamp = new Date();
          data.notificationType = NotificationTypes.CUSTOM;
          data.link = this.mailoptions.context.link;
        }
        break;

      case 'sms':
        if (this.smsoptions) {
          data.type = NOTIFICATION_TYPE.SMS;
          data.recipient = this.smsoptions.message.to;
          data.notificationType = this.smsoptions.message.notificationType;
          data.data.message = this.smsoptions.message.body;
          data.data.title = `Sms initiated by ${this.smsoptions.provider} service`;
          data.data.timestamp = new Date();
          data.priority = PRIORITY_TYPES.HIGH;
        }
        return data;

      default:
        return data;
    }
    return data;
  }
}
