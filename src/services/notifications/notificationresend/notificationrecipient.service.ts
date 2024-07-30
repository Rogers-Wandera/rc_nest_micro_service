import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { NotificationRecipient } from '@notifier/rtechnotifier/types/notify.types';
import { PRIORITY_TYPES } from 'src/app/types/app.types';
import { NotificationResendRecipients } from 'src/entities/core/notificationresendrecipient.entity';
import { EntityDataSource } from 'src/model/enity.data.model';
import { EntityModel } from 'src/model/entity.model';

@Injectable()
export class NotificationResendRecipientService extends EntityModel<NotificationResendRecipients> {
  constructor(datasource: EntityDataSource) {
    super(NotificationResendRecipients, datasource);
  }

  async CreateRecipient(recipients: NotificationRecipient) {
    try {
      this.entity.createdBy = 'system';
      this.entity.updatedBy = 'system';
      if (recipients.type === 'broadcast') {
        this.entity.recipient = 'broadcast';
        this.entity.priority = PRIORITY_TYPES.HIGH;
        const entity = this.repository.create(this.entity);
        return await this.repository.save(entity);
      } else {
        for (const recipient in recipients.recipients) {
          this.entity.recipient = recipients.recipients[recipient].to as string;
          this.entity.priority =
            recipients.recipients[recipient].priority || PRIORITY_TYPES.HIGH;
          const entity = this.repository.create(this.entity);
          await this.repository.save(entity);
        }
      }
      return true;
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
