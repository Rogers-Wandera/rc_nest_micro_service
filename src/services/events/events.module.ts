import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoClientModule } from 'nestjs-io-client';
import { EnvConfig } from 'src/app/configs/envconfigs';
import { EventGatewayService } from './events.service';

@Module({
  imports: [
    IoClientModule.forRootAsync({
      useFactory: (config: ConfigService<EnvConfig>) => {
        return {
          uri: config.get<string>('socketurl'),
          options: {
            withCredentials: true,
            retries: 0,
            reconnectionAttempts: 10,
            reconnectionDelay: 5000,
            requestTimeout: 40000,
            auth: {
              token: config.get<string>('sockettoken'),
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [EventGatewayService],
  exports: [EventGatewayService],
})
export class EventGateWayModule {}
