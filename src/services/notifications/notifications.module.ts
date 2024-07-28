import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EnvConfig } from 'src/app/configs/envconfigs';
import { NotificationController } from './notifications.controller';
import { NotificationService } from './notification/notification.service';
import { RTECHPushNotificationModule } from '@notifier/rtechnotifier/pushnotification/push.module';
import { NotificationResendService } from './notificationresend/notificationresend.service';
import { NotificationResendBodyService } from './notificationresend/notificationresendbody.service';
import { NotificationResendMediaService } from './notificationresend/notificationmedia.service';
import { NotificationResendMetaService } from './notificationresend/notificationmeta.service';
import { NotificationResendRecipientService } from './notificationresend/notificationrecipient.service';

@Global()
@Module({
  imports: [
    forwardRef(() => RTECHPushNotificationModule),
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
  ],
  controllers: [NotificationController],
  exports: [
    NotificationService,
    NotificationResendService,
    NotificationResendBodyService,
    NotificationResendMediaService,
    NotificationResendMetaService,
    NotificationResendRecipientService,
  ],
})
export class NotificationModule {}
