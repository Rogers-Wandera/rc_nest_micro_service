import { Module } from '@nestjs/common';
import { UploaderController } from './uploader.controller';
import { RUPLOADER_TYPE, RuploaderModule } from '@rupload/ruploader';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from 'src/app/configs/envconfigs';

@Module({
  imports: [
    RuploaderModule.forRootAsync({
      useFactory: (config: ConfigService<EnvConfig>) => {
        const cloudinary = config.get('cloudinary');
        return {
          type: RUPLOADER_TYPE.CLOUDINARY,
          options: {
            ...cloudinary,
          },
        };
      },
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'UPLOAD_SERVICE',
        useFactory: (config: ConfigService<EnvConfig>) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('rabbitmqurl')],
            queue: 'upload_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [UploaderController],
  exports: [ClientsModule],
})
export class UploaderModule {}
