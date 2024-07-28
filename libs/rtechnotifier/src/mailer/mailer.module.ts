import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { RTECHEmailService } from './mailer.service';
import { EnvConfig, mailconfig } from 'src/app/configs/envconfigs';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService<EnvConfig>) => ({
        transport: {
          host: config.get<mailconfig>('mail').host,
          secure: true,
          auth: config.get<mailconfig>('mail').auth,
          port: config.get<mailconfig>('mail').port,
        },
        defaults: {
          from: 'R-TECH',
        },
        template: {
          dir: 'src/app/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RTECHEmailService],
  exports: [RTECHEmailService],
})
export class RTECHEmailModule {}
