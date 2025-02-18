import { Controller, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { NotificationTypes } from '@notifier/rtechnotifier/types/enums';
import { RTechSystemNotificationType } from '@notifier/rtechnotifier/types/notify.types';
import {
  RUPLOADER_TYPE,
  RuploaderService,
  RUploadOptions,
  RUploadReturn,
} from '@rupload/ruploader';
import { Message, Channel } from 'amqplib';
import { InjectIoClientProvider, IoClient } from 'nestjs-io-client';
import { cloudinary, EnvConfig } from 'src/app/configs/envconfigs';
import {
  NOTIFICATION_PATTERN,
  UPLOADER_PATTERN,
} from 'src/app/patterns/notification.patterns';
import { NOTIFICATION_TYPE, PRIORITY_TYPES } from 'src/app/types/app.types';
import { NotificationService } from '../notifications/notification/notification.service';
import { NotificationData } from '../notifications/notification/notification.type';

@Controller('uploader')
export class UploaderController {
  private logger = new Logger();
  constructor(
    private readonly ruploder: RuploaderService,
    private readonly configservice: ConfigService<EnvConfig>,
    @InjectIoClientProvider()
    private readonly io: IoClient,
    private notificationservice: NotificationService,
    @Inject('NOTIFICATION_SERVICE') private rabbitClient: ClientProxy,
  ) {}

  @MessagePattern({ cmd: UPLOADER_PATTERN.UPLOAD })
  async upload(@Payload() data: RUploadOptions, @Ctx() context: RmqContext) {
    try {
      this.ruploder.socket = this.io;
      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      const folder =
        this.configservice.get<cloudinary>('cloudinary').mainfolder;
      const options: RUploadOptions = { ...data };
      if (data.type === RUPLOADER_TYPE.CLOUDINARY) {
        const folderExists = data?.options?.folder ? data?.options?.folder : '';
        options['options'] = {
          ...options?.options,
          folder: `${folder}/${folderExists}`,
        };
      }
      this.ruploder.successCallBack = (results) =>
        this.HandleSaveUpload(data, results);
      const upload$ = this.ruploder.upload(options);
      upload$.subscribe({
        next: (res: { progress: number; filename: string }) => {
          this.io.emit('upload_progress', {
            progress: res.progress,
            meta: data?.meta,
            filename: res?.filename,
          });
        },
        error: (err: {
          error: string;
          filename: string;
          meta: Record<string, any>;
        }) => {
          this.logger.error(err.error);
          channel.ack(originalMsg);
          this.io.emit('upload_error', {
            error: `Cloudinary error: ${err.error}`,
            filename: err.filename,
            meta: err.meta,
          });
        },
        complete: () => {
          this.logger.verbose('completed');
        },
      });
      channel.ack(originalMsg);
    } catch (error) {
      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      this.logger.error(error.message);
      channel.ack(originalMsg);
    }
  }

  private buildSystemNotification(
    data: RUploadOptions,
    filename: string,
  ): NotificationData {
    return {
      pattern: NOTIFICATION_PATTERN.SYSTEM_NOTIFICATION,
      priority: PRIORITY_TYPES.MEDIUM,
      recipient: [{ to: data?.meta.userId }],
      type: NOTIFICATION_TYPE.PUSH_SYSTEM,
      notificationType: NotificationTypes.UPLOAD,
      command: NOTIFICATION_PATTERN.SYSTEM_NOTIFICATION,
      createdBy: 'system',
      data: {
        title: data?.meta?.type || 'File Upload',
        message: `Your upload of file: ${filename} is complete`,
        timestamp: new Date(),
        meta: data?.meta,
      },
    };
  }

  private async HandleSaveUpload(data: RUploadOptions, results: RUploadReturn) {
    try {
      if (data?.meta?.userId) {
        await this.notificationservice.SaveSystemNotification(
          this.buildSystemNotification(data, results.filename),
        );
        this.rabbitClient.emit(
          { cmd: NOTIFICATION_PATTERN.USER_NOTIFICATIONS },
          {
            userId: data.meta.userId,
          },
        );
      }
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
