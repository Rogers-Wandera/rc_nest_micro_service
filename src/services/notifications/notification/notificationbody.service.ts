import { Injectable, Scope } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { NotificationResendBody } from 'src/entities/core/notificationresendbody.entity';
import { EntityDataSource } from 'src/model/enity.data.model';
import { EntityModel } from 'src/model/entity.model';
import { mediaTypes } from '@notifier/rtechnotifier/types/notify.types';
import { NotificationBody } from 'src/entities/core/notificationbody.entity';
import { NotificationMediaService } from './notificationmedia.service';
import { NotificationMetaService } from './notificationmeta.service';

type body = {
  title: string;
  message: string;
  timestamp: Date;
  media?: mediaTypes[];
  meta?: Record<string, string | number | Date | Boolean>;
};

@Injectable({ scope: Scope.TRANSIENT })
export class NotificationBodyService extends EntityModel<NotificationBody> {
  constructor(
    datasource: EntityDataSource,
    private readonly media: NotificationMediaService,
    private readonly meta: NotificationMetaService,
  ) {
    super(NotificationBody, datasource);
  }

  async CreateBody(data: body) {
    try {
      this.entity.updatedBy = this.entity.createdBy;
      this.entity.message = data.message;
      this.entity.title = data.title;
      this.entity.timestamp = data.timestamp;
      const entity = this.repository.create(this.entity);
      const response = await this.repository.save(entity);
      this.media.entity.body = response;
      this.meta.entity.body = response;
      this.media.entity.createdBy = this.entity.createdBy;
      this.meta.entity.createdBy = this.entity.createdBy;
      await this.media.CreateMedia(data.media);
      await this.meta.CreateMeta(data.meta);
      return response;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  HandleMediasRebuild(body: NotificationBody) {
    const mediaUrl: mediaTypes[] = [];
    if (body.media.length > 0) {
      for (const media in body.media) {
        const url = {
          imageUrl: body.media[media].url,
          type: body.media[media].type,
        };
        mediaUrl.push(url);
      }
    }
    return mediaUrl;
  }

  HandleMetaRebuild(body: NotificationBody) {
    const meta: Record<string, string | number | Boolean | Date> = {};
    if (body.meta.length > 0) {
      for (const item in body.meta) {
        meta[body.meta[item].name] = body.meta[item].value;
      }
    }
    return meta;
  }
}
