import { BadRequestException, Injectable } from '@nestjs/common';
import { RTECHEmailService } from './mailer/mailer.service';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { RTECHPushNotificationService } from './pushnotification/push.service';
import {
  PushOptions,
  RTechSmsMessage,
  RTechSmsTypes,
} from './types/notify.types';
import { RTechSmsService } from './smsnotification/sms.service';
import { EnvConfig } from 'src/app/configs/envconfigs';

@Injectable()
export class RTechNotifier {
  public mailoptions: ISendMailOptions | null;
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
    switch (type) {
      case 'email':
        if (!this.mailoptions)
          throw new BadRequestException('Mail options are required');
        await this.emailservice.SendEmail({ ...this.mailoptions });
        return 'Email sent successfully';
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
        return 'Push Notification sent successfully';
      case 'sms':
        if (!this.smsoptions)
          throw new BadRequestException('Sms options are required');
        this.smsservice.type = this.smsoptions.provider;
        const response = await this.smsservice.sendMessage(
          this.smsoptions.message,
        );
        if (typeof response === 'string') {
          return response;
        }
        return 'Sms sent successfully';
      default:
        throw new BadRequestException(
          'Notification type not supported at the moment',
        );
    }
  }
}
