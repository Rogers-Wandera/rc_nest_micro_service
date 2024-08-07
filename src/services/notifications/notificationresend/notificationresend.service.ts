import { BadRequestException, Injectable, Scope } from '@nestjs/common';
import {
  EmailOptions,
  RTechSystemNotificationType,
  SMSOptions,
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
import { v4 } from 'uuid';

@Injectable({ scope: Scope.TRANSIENT })
export class NotificationResendService extends EntityModel<NotificationResend> {
  constructor(
    datasource: EntityDataSource,
    private readonly resendbody: NotificationResendBodyService,
    private readonly resendrecipient: NotificationResendRecipientService,
    private service: NotificationService,
  ) {
    super(NotificationResend, datasource);
  }
  private generateId() {
    this.entity.id = v4();
  }
  async ResendSystemNotification(data: RTechSystemNotificationType) {
    try {
      this.generateId();
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
        recipientHash: this.Hash(recipient),
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
            recipientHash: this.Hash(recipients[recipient].to as string),
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
      this.generateId();
      this.entity.pattern = NOTIFICATION_PATTERN.NOTIFY;
      this.entity.priority = PRIORITY_TYPES.HIGH;
      this.entity.type = NOTIFICATION_TYPE.EMAIL;
      this.entity.command = NOTIFICATION_PATTERN.NOTIFY;
      this.entity.notificationType =
        data.notificationType || NotificationTypes.CUSTOM;
      this.entity.createdBy = data.createdBy || 'system';
      this.entity.updatedBy = data.createdBy || 'system';
      this.entity.recipientCount = Array.isArray(data.payload.to)
        ? data.payload.to.length
        : 1;
      const response = await this.repository.save(this.entity);
      this.resendbody.entity.notification = response;
      this.resendbody.entity.createdBy = data.createdBy || 'system';
      this.resendrecipient.entity.createdBy = data.createdBy || 'system';
      this.resendrecipient.entity.notification = response;
      const meta: Record<string, string | number | Date | Boolean> = {};
      for (const key in data.payload.context) {
        if (key !== 'body') {
          meta[key] = data.payload.context[key];
        }
      }
      await this.resendbody.CreateBody({
        timestamp: new Date(),
        title: data.payload.subject,
        message: data.payload.context.body,
        template: data.payload.template,
        meta: meta,
      });
      await this.resendrecipient.CreateRecipient({
        type: 'no broadcast',
        recipients: data.payload.to,
      });
      this.entity = {} as any;
      return response;
    } catch (error) {
      throw error;
    }
  }

  async ResendSmsService(data: SMSOptions) {
    try {
      this.generateId();
      this.entity.pattern = NOTIFICATION_PATTERN.NOTIFY;
      this.entity.priority = PRIORITY_TYPES.HIGH;
      this.entity.type = NOTIFICATION_TYPE.SMS;
      this.entity.command = NOTIFICATION_PATTERN.NOTIFY;
      this.entity.notificationType =
        data.payload.message.notificationType || NotificationTypes.CUSTOM;
      this.entity.createdBy = 'system';
      this.entity.updatedBy = 'system';
      this.entity.recipientCount = Array.isArray(data.payload.message.to)
        ? data.payload.message.to.length
        : 1;
      const response = await this.repository.save(this.entity);
      this.resendbody.entity.notification = response;
      this.resendrecipient.entity.notification = response;
      this.resendbody.entity.createdBy = data.createdBy || 'system';
      this.resendrecipient.entity.createdBy = data.createdBy || 'system';
      await this.resendbody.CreateBody({
        timestamp: new Date(),
        title: `Sms sent from ${data.payload.provider} service`,
        message: data.payload.message.body,
      });
      await this.resendrecipient.CreateRecipient({
        type: 'no broadcast',
        recipients: data.payload.message.to,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async ReconcileEmailSms(
    data: NotificationResendRecipients,
    type: 'reconcile' | 'resend' = 'reconcile',
  ) {
    try {
      if (type === 'reconcile') {
        await this.repository.update(
          { id: data.notification.id },
          { resendCount: data.notification.resendCount + 1 },
        );
        await this.service.SaveSystemNotification(this.BuildSmsEmailData(data));
        const check = await this.repository.findOne({
          where: { id: data.notification.id },
        });
        if (
          check.recipientCount === check.resendCount ||
          check.resendCount > check.recipientCount
        ) {
          await this.repository.update(
            { id: data.notification.id },
            { status: NOTIFICATION_RESEND_STATUS.SENT, updateDate: new Date() },
          );
        }
        await this.resendrecipient.repository.update(
          { id: data.id },
          { status: NOTIFICATION_RESEND_STATUS.SENT, updateDate: new Date() },
        );
      } else {
        await this.resendrecipient.repository.update(
          { id: data.id },
          {
            status: NOTIFICATION_RESEND_STATUS.RESCHEDULED,
            updateDate: new Date(),
            retries: data.retries + 1,
          },
        );
      }
    } catch (error) {
      throw error;
    }
  }
  private BuildSmsEmailData(data: NotificationResendRecipients) {
    const meta = this.resendbody.HandleMetaRebuild(data.notification.body);
    const medias = this.resendbody.HandleMediasRebuild(data.notification.body);
    const recipient = { to: data.recipient, priority: data.priority };
    const senddata: NotificationData = {
      recipient: [recipient],
      data: {
        meta: meta,
        mediaUrl: medias,
        message: data.notification.body.message,
        timestamp: data.notification.body.timestamp,
        title: data.notification.body.title,
      },
      pattern: data.notification.pattern,
      command: data.notification.command,
      createdBy: data.notification.createdBy,
      type: data.notification.type,
      priority: data.notification.priority,
      notificationType: data.notification.notificationType,
      link: data.notification.link,
    };
    return senddata;
  }

  async HandleCloseResend(data: NotificationResendRecipients) {
    if (data.retries >= 10) {
      this.resendrecipient.repository.update(
        { id: data.id },
        {
          status: NOTIFICATION_RESEND_STATUS.FAILED,
          updateDate: new Date(),
        },
      );
      this.repository.update(
        { id: data.notification.id },
        { resendCount: data.notification.resendCount + 1 },
      );
      const check = await this.repository.findOne({
        where: { id: data.notification.id },
      });
      if (check.resendCount >= check.recipientCount) {
        this.repository.update(
          { id: data.notification.id },
          {
            status: NOTIFICATION_RESEND_STATUS.CLOSED,
          },
        );
      }
    }
  }
}
