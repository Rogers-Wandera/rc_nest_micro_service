import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationResendService } from '../notifications/notificationresend/notificationresend.service';
import { NotificationResendRecipientService } from '../notifications/notificationresend/notificationrecipient.service';
import { RTechNotifier } from '@notifier/rtechnotifier';
import { NotificationResendRecipients } from 'src/entities/core/notificationresendrecipient.entity';

@Injectable()
export class TaskScheduleService {
  constructor(
    private readonly resendservice: NotificationResendService,
    private readonly resendrecipients: NotificationResendRecipientService,
    private rtechservice: RTechNotifier,
  ) {}

  private readonly logger = new Logger(TaskScheduleService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  async HandleEmailSmsResend() {
    try {
      const data = await this.resendrecipients.HandleResendRecipients();
      if (data.length > 0) {
        for (const notification in data) {
          try {
            const type = data[notification].notification.type;
            if (data[notification].notification.type === 'email') {
              this.buildEmailMessage(data[notification]);
              await this.rtechservice.notification('email');
            } else if (data[notification].notification.type === 'sms') {
              this.buildSmsMessage(data[notification]);
              await this.rtechservice.notification('sms');
            }
            await this.resendservice.ReconcileEmailSms(data[notification]);
            this.logger.log(
              `${type} has been sent to ${data[notification].recipient}`,
            );
          } catch (error) {
            await this.resendservice.ReconcileEmailSms(
              data[notification],
              'resend',
            );
            this.logger.error(error.message);
          }
        }
      }
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  private buildEmailMessage(data: NotificationResendRecipients) {
    const meta: Record<string, any> = {};
    const metadata = data.notification.body.meta;
    for (const mkey in metadata) {
      meta[metadata[mkey].name] = metadata[mkey].value;
    }
    this.rtechservice.mailoptions = {
      context: { body: data.notification.body.message, ...meta },
      template: data.notification.body.template,
      subject: data.notification.body.title,
      to: [
        {
          to: data.recipient,
          priority: data.priority,
        },
      ],
    };
  }

  private buildSmsMessage(data: NotificationResendRecipients) {
    this.rtechservice.smsoptions.provider = 'pahappa';
    this.rtechservice.smsoptions.message.body = data.notification.body.message;
    this.rtechservice.smsoptions.message.to = [
      {
        to: data.recipient,
        priority: data.priority,
      },
    ];
    this.rtechservice.smsoptions.message.priority = data.priority;
    this.rtechservice.smsoptions.message.notificationType =
      data.notification.notificationType;
  }

  @Cron('0 */2 * * * *')
  async HandleCancelFailed() {
    try {
      const data = await this.resendrecipients.HandleResendRecipients(true);
      if (data.length > 0) {
        for (const notification in data) {
          await this.resendservice.HandleCloseResend(data[notification]);
        }
      }
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
