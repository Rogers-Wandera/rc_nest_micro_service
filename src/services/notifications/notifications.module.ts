import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EnvConfig } from 'src/app/configs/envconfigs';
import { NotificationController } from './notifications.controller';
import { NotificationService } from './notification/notification.service';
import { NotificationResendService } from './notificationresend/notificationresend.service';
import { NotificationResendBodyService } from './notificationresend/notificationresendbody.service';
import { NotificationResendMediaService } from './notificationresend/notificationmedia.service';
import { NotificationResendMetaService } from './notificationresend/notificationmeta.service';
import { NotificationResendRecipientService } from './notificationresend/notificationrecipient.service';
import { NotificationBodyService } from './notification/notificationbody.service';
import { NotificationMediaService } from './notification/notificationmedia.service';
import { NotificationMetaService } from './notification/notificationmeta.service';
import { NotificationRecipientService } from './notification/notificationrecipient.service';
import { RTechNotifierModule } from '@notifier/rtechnotifier';

@Global()
@Module({
  imports: [
    forwardRef(() => RTechNotifierModule),
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE',
        useFactory: (config: ConfigService<EnvConfig>) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('rabbitmqurl')],
            queue: 'notifications_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [
    NotificationService,
    NotificationResendService,
    NotificationResendBodyService,
    NotificationResendMediaService,
    NotificationResendMetaService,
    NotificationResendRecipientService,
    NotificationBodyService,
    NotificationMediaService,
    NotificationMetaService,
    NotificationRecipientService,
  ],
  controllers: [NotificationController],
  exports: [
    NotificationService,
    NotificationResendService,
    NotificationResendBodyService,
    NotificationResendMediaService,
    NotificationResendMetaService,
    NotificationResendRecipientService,
    NotificationBodyService,
    NotificationMediaService,
    NotificationMetaService,
    NotificationRecipientService,
  ],
})
export class NotificationModule {}
