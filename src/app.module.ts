import { Global, Module, ValidationPipe } from '@nestjs/common';
import { NotificationModule } from './services/notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';
import { envconfig } from './app/configs/envconfigs';
import { RTechNotifierModule } from '@notifier/rtechnotifier';
import { DatabaseModule } from './db/database.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from './app/contexts/exceptions/exceptions';
import { RpcException } from '@nestjs/microservices';
import { RetryInterceptor } from './app/contexts/interceptors/retry.interceptor';
import { EventGateWayModule } from './services/events/events.module';
import { ModelModule } from './model/model.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      load: [envconfig],
      cache: true,
    }),
    DatabaseModule,
    NotificationModule,
    RTechNotifierModule,
    EventGateWayModule,
    ModelModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useFactory: () => {
        return new ValidationPipe({
          transform: false,
          whitelist: true,
          forbidNonWhitelisted: true,
          forbidUnknownValues: true,
          disableErrorMessages: false,
          exceptionFactory: (errors) => {
            const formattedErrors = errors
              .map((error) => {
                return `${error.property} - ${Object.values(error.constraints)}`;
              })
              .join(', ');
            return new RpcException(formattedErrors);
          },
        });
      },
    },
    { provide: APP_INTERCEPTOR, useClass: RetryInterceptor },
  ],
  exports: [RTechNotifierModule, NotificationModule],
})
export class AppModule {}
