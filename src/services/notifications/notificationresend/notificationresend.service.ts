import { BadRequestException, Injectable } from '@nestjs/common';
import { RTechSystemNotificationType } from '@notifier/rtechnotifier/types/notify.types';
import { NOTIFICATION_TYPE } from 'src/app/types/app.types';
import { NotificationResend } from 'src/entities/core/notificationresend.entity';
import { EntityDataSource } from 'src/model/enity.data.model';
import { EntityModel } from 'src/model/entity.model';
import { NotificationResendBodyService } from './notificationresendbody.service';
import { NotificationResendRecipientService } from './notificationrecipient.service';

@Injectable()
export class NotificationResendService extends EntityModel<NotificationResend> {
  constructor(
    datasource: EntityDataSource,
    private readonly resendbody: NotificationResendBodyService,
    private readonly resendrecipient: NotificationResendRecipientService,
  ) {
    super(NotificationResend, datasource);
  }
  async ResendSystemNotification(data: RTechSystemNotificationType) {
    try {
      this.entity.pattern = data.pattern;
      this.entity.priority = data.priority;
      this.entity.type = NOTIFICATION_TYPE.PUSH_SYSTEM;
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
}
