import { Controller, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import {
  RUPLOADER_TYPE,
  RuploaderService,
  RUploadOptions,
} from '@rupload/ruploader';
import { Message, Channel } from 'amqplib';
import { InjectIoClientProvider, IoClient } from 'nestjs-io-client';
import { cloudinary, EnvConfig } from 'src/app/configs/envconfigs';
import { UPLOADER_PATTERN } from 'src/app/patterns/notification.patterns';

@Controller('uploader')
export class UploaderController {
  private logger = new Logger();
  constructor(
    private readonly ruploder: RuploaderService,
    private readonly configservice: ConfigService<EnvConfig>,
    @InjectIoClientProvider()
    private readonly io: IoClient,
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
}
