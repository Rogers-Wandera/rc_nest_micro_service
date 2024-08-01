import { Injectable, Scope } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { mediaTypes } from '@notifier/rtechnotifier/types/notify.types';
import { NotificationResendMedia } from 'src/entities/core/notificationresendbodymedia.entity';
import { EntityDataSource } from 'src/model/enity.data.model';
import { EntityModel } from 'src/model/entity.model';

@Injectable({ scope: Scope.TRANSIENT })
export class NotificationResendMediaService extends EntityModel<NotificationResendMedia> {
  constructor(datasource: EntityDataSource) {
    super(NotificationResendMedia, datasource);
  }

  async CreateMedia(medias?: mediaTypes[]) {
    try {
      if (medias) {
        this.entity.createdBy = 'system';
        this.entity.updatedBy = 'system';
        for (const media in medias) {
          this.entity.url = medias[media].imageUrl;
          this.entity.type = medias[media].type;
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
