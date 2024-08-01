import { Injectable, Scope } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { RecipientType } from '@notifier/rtechnotifier/types/notify.types';
import { NotificationRecipient } from 'src/entities/core/notificationrecipient.entity';
import { EntityDataSource } from 'src/model/enity.data.model';
import { EntityModel } from 'src/model/entity.model';

@Injectable({ scope: Scope.TRANSIENT })
export class NotificationRecipientService extends EntityModel<NotificationRecipient> {
  constructor(datasource: EntityDataSource) {
    super(NotificationRecipient, datasource);
  }

  async CreateRecipient(recipients: RecipientType[]) {
    try {
      this.entity.updatedBy = this.entity.createdBy;
      for (const recipient in recipients) {
        this.entity.recipient = recipients[recipient].to as string;
        this.entity.priority = recipients[recipient].priority;
        const entity = this.repository.create(this.entity);
        await this.repository.save(entity);
      }
      return true;
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
