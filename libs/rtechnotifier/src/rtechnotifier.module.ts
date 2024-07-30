import { forwardRef, Global, Module } from '@nestjs/common';
import { RTechNotifier } from './rtechnotifier.service';
import { RTECHEmailModule } from './mailer/mailer.module';
import { ConfigService } from '@nestjs/config';
import { RTECHPushNotificationModule } from './pushnotification/push.module';
import { RtechSmsModule } from './smsnotification/sms.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EnvConfig } from 'src/app/configs/envconfigs';
import { NotificationModule } from 'src/services/notifications/notifications.module';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE',
        useFactory: async (config: ConfigService<EnvConfig>) => {
          return {
            transport: Transport.RMQ,
            options: {
              urls: [config.get<string>('rabbitmqurl')],
              queue: 'notifications_queue',
              queueOptions: {
                durable: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
    RTECHEmailModule,
    RTECHPushNotificationModule,
    RtechSmsModule,
    forwardRef(() => NotificationModule),
  ],
  providers: [RTechNotifier],
  exports: [RTechNotifier, ClientsModule],
})
export class RTechNotifierModule {}
