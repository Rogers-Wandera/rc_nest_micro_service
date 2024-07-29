import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { NotificationResendBody } from 'src/entities/core/notificationresendbody.entity';
import { EntityDataSource } from 'src/model/enity.data.model';
import { EntityModel } from 'src/model/entity.model';
import { NotificationResendMediaService } from './notificationmedia.service';
import { NotificationResendMetaService } from './notificationmeta.service';
import { mediaTypes } from '@notifier/rtechnotifier/types/notify.types';

type body = {
  title: string;
  message: string;
  timestamp: Date;
  media?: mediaTypes[];
  meta?: Record<string, string | number | Date | Boolean>;
};

@Injectable()
export class NotificationResendBodyService extends EntityModel<NotificationResendBody> {
  constructor(
    datasource: EntityDataSource,
    private readonly resendmedia: NotificationResendMediaService,
    private readonly resendmeta: NotificationResendMetaService,
  ) {
    super(NotificationResendBody, datasource);
  }

  async CreateBody(data: body) {
    try {
      this.entity.createdBy = 'system';
      this.entity.updatedBy = 'system';
      this.entity.message = data.message;
      this.entity.title = data.title;
      this.entity.timestamp = data.timestamp;
      const entity = this.repository.create(this.entity);
      const response = await this.repository.save(entity);
      this.resendmedia.entity.body = response;
      this.resendmeta.entity.body = response;
      await this.resendmedia.CreateMedia(data.media);
      await this.resendmeta.CreateMeta(data.meta);
      return response;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  HandleMediasRebuild(body: NotificationResendBody) {
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

  HandleMetaRebuild(body: NotificationResendBody) {
    const meta: Record<string, string | number | Boolean | Date> = {};
    if (body.meta.length > 0) {
      for (const item in body.meta) {
        meta[body.meta[item].name] = body.meta[item].value;
      }
    }
    return meta;
  }
}
