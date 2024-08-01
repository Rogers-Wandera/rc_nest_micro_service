import { Injectable, Scope } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { mediaTypes } from '@notifier/rtechnotifier/types/notify.types';
import { NotificationMedia } from 'src/entities/core/notificationmedia.entity';
import { EntityDataSource } from 'src/model/enity.data.model';
import { EntityModel } from 'src/model/entity.model';

@Injectable({ scope: Scope.TRANSIENT })
export class NotificationMediaService extends EntityModel<NotificationMedia> {
  constructor(datasource: EntityDataSource) {
    super(NotificationMedia, datasource);
  }

  async CreateMedia(medias?: mediaTypes[]) {
    try {
      if (medias) {
        this.entity.updatedBy = this.entity.createdBy;
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
