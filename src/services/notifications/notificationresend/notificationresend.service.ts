import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EmailOptions,
  RTechSmsMessage,
  RTechSmsOption,
  RTechSystemNotificationType,
} from '@notifier/rtechnotifier/types/notify.types';
import {
  NOTIFICATION_RESEND_STATUS,
  NOTIFICATION_TYPE,
  PRIORITY_TYPES,
} from 'src/app/types/app.types';
import { NotificationResend } from 'src/entities/core/notificationresend.entity';
import { EntityDataSource } from 'src/model/enity.data.model';
import { EntityModel } from 'src/model/entity.model';
import { NotificationResendBodyService } from './notificationresendbody.service';
import { NotificationResendRecipientService } from './notificationrecipient.service';
import { NOTIFICATION_PATTERN } from 'src/app/patterns/notification.patterns';
import { In } from 'typeorm';
import { NotificationResendRecipients } from 'src/entities/core/notificationresendrecipient.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationData } from '../notification/notification.type';
import { NotificationTypes } from '@notifier/rtechnotifier/types/enums';

@Injectable()
export class NotificationResendService extends EntityModel<NotificationResend> {
  constructor(
    datasource: EntityDataSource,
    private readonly resendbody: NotificationResendBodyService,
    private readonly resendrecipient: NotificationResendRecipientService,
    private service: NotificationService,
  ) {
    super(NotificationResend, datasource);
  }
  async ResendSystemNotification(data: RTechSystemNotificationType) {
    try {
      this.entity.pattern = data.pattern;
      this.entity.priority = data.priority;
      this.entity.type = NOTIFICATION_TYPE.PUSH_SYSTEM;
      this.entity.command = NOTIFICATION_PATTERN.SYSTEM_NOTIFICATION;
      this.entity.notificationType = data.type;
      this.entity.link = data.link;
      this.entity.createdBy = 'system';
      this.entity.updatedBy = 'system';
      this.entity.recipientCount = Array.isArray(data.recipient)
        ? data.recipient.length
        : 1;
      const response = await this.repository.save(this.entity);
      this.resendbody.entity.notification = response;
      this.resendrecipient.entity.notification = response;
      await this.resendbody.CreateBody({
        timestamp: data.data.timestamp,
        title: data.data.title,
        message: data.data.message,
        media: data.data.mediaUrl,
        meta: data.data.meta,
      });
      await this.resendrecipient.CreateRecipient(data.recipient);
      return response;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async GetRecipientResendNotification(recipient: string) {
    const response = await this.resendrecipient.repository.find({
      where: {
        recipient,
        status: In([
          NOTIFICATION_RESEND_STATUS.PENDING,
          NOTIFICATION_RESEND_STATUS.RESCHEDULED,
        ]),
      },
    });
    if (response.length > 0) {
      const resenddata: RTechSystemNotificationType[] = [];
      for (const item of response) {
        const data = this.HandleBuildData(item);
        resenddata.push(data);
      }
      return resenddata;
    }
    return null;
  }

  private HandleBuildData(
    recipient: NotificationResendRecipients,
  ): RTechSystemNotificationType {
    const media = this.resendbody.HandleMediasRebuild(
      recipient.notification.body,
    );
    const meta = this.resendbody.HandleMetaRebuild(recipient.notification.body);
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
  async ReconcileResend(
    data: RTechSystemNotificationType,
    type: 'resend' | 'reconcile' = 'reconcile',
  ) {
    const response = await this.HandleResendReconcile(data, type);
    if (response) {
      const res = await this.HandleResendRecipients(data, type, response.id);
      return res;
    }
    return false;
  }

  private async HandleResendRecipients(
    data: RTechSystemNotificationType,
    type: 'resend' | 'reconcile',
    resendId: string,
  ) {
    if (data.recipient.type === 'no broadcast') {
      const recipients = data.recipient.recipients;
      for (const recipient in recipients) {
        const res = await this.resendrecipient.repository.findOne({
          relations: { notification: true },
          where: {
            recipient: recipients[recipient].to as string,
            notification: { id: resendId },
          },
        });
        if (res) {
          if (type === 'reconcile') {
            await this.resendrecipient.repository.update(
              { id: res.id },
              {
                status: NOTIFICATION_RESEND_STATUS.SENT,
                updateDate: new Date(),
              },
            );
          } else {
            await this.resendrecipient.repository.update(
              { id: res.id },
              {
                status: NOTIFICATION_RESEND_STATUS.RESCHEDULED,
                updateDate: new Date(),
                retries: res.retries + 1,
              },
            );
          }
        }
      }
      return true;
    }
    return false;
  }

  private async HandleResendReconcile(
    data: RTechSystemNotificationType,
    type: 'resend' | 'reconcile',
  ) {
    const response = await this.repository.findOne({
      where: {
        id: data.resendId,
      },
    });
    if (response) {
      if (type === 'reconcile') {
        await this.repository.update(
          { id: data.resendId },
          { resendCount: response.resendCount + 1 },
        );
        const senddata: NotificationData = {
          type: NOTIFICATION_TYPE.PUSH_SYSTEM,
          notificationType: data.type,
          pattern: data.pattern,
          priority: data.priority,
          createdBy: data.createdBy || 'system',
          data: data.data,
          link: data.link,
          recipient:
            data.recipient.type === 'no broadcast'
              ? data.recipient.recipients
              : [{ to: 'broadcast' }],
          command: NOTIFICATION_PATTERN.SYSTEM_NOTIFICATION_SENT,
        };
        await this.service.SaveSystemNotification(senddata);
      } else {
        await this.repository.update(
          { id: data.resendId },
          { status: NOTIFICATION_RESEND_STATUS.PENDING },
        );
      }
      const check = await this.repository.findOne({
        where: { id: data.resendId },
      });
      if (
        check.recipientCount === check.resendCount ||
        check.resendCount > check.recipientCount
      ) {
        await this.repository.update(
          { id: data.resendId },
          { status: NOTIFICATION_RESEND_STATUS.SENT, updateDate: new Date() },
        );
      }
    }
    return response;
  }

  async ResendEmailService(data: EmailOptions) {
    try {
      this.entity.pattern = NOTIFICATION_PATTERN.NOTIFY;
      this.entity.priority = PRIORITY_TYPES.HIGH;
      this.entity.type = NOTIFICATION_TYPE.EMAIL;
      this.entity.command = NOTIFICATION_PATTERN.NOTIFY;
      this.entity.notificationType =
        data.notificationType || NotificationTypes.CUSTOM;
      this.entity.createdBy = 'system';
      this.entity.updatedBy = 'system';
      this.entity.recipientCount = Array.isArray(data.payload.to)
        ? data.payload.to.length
        : 1;
      const response = await this.repository.save(this.entity);
      this.resendbody.entity.notification = response;
      this.resendrecipient.entity.notification = response;
      await this.resendbody.CreateBody({
        timestamp: new Date(),
        title: data.payload.subject,
        message: data.payload.context.body,
      });
      await this.resendrecipient.CreateRecipient({
        type: 'no broadcast',
        recipients: data.payload.to,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async ResendSmsService(data: RTechSmsOption) {
    try {
      this.entity.pattern = NOTIFICATION_PATTERN.NOTIFY;
      this.entity.priority = PRIORITY_TYPES.HIGH;
      this.entity.type = NOTIFICATION_TYPE.SMS;
      this.entity.command = NOTIFICATION_PATTERN.NOTIFY;
      this.entity.notificationType =
        data.message.notificationType || NotificationTypes.CUSTOM;
      this.entity.createdBy = 'system';
      this.entity.updatedBy = 'system';
      this.entity.recipientCount = Array.isArray(data.message.to)
        ? data.message.to.length
        : 1;
      const response = await this.repository.save(this.entity);
      this.resendbody.entity.notification = response;
      this.resendrecipient.entity.notification = response;
      await this.resendbody.CreateBody({
        timestamp: new Date(),
        title: `Sms sent from ${data.provider} service`,
        message: data.message.body,
      });
      await this.resendrecipient.CreateRecipient({
        type: 'no broadcast',
        recipients: data.message.to,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}
