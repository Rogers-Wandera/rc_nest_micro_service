import { Module } from '@nestjs/common';
import { TwilioSMSService } from './twiliosms.setup';
import { RTechSmsService } from './sms.service';
import { PahappaSMSService } from './pahappasms.setup';

@Module({
  providers: [TwilioSMSService, PahappaSMSService, RTechSmsService],
  exports: [RTechSmsService],
})
export class RtechSmsModule {}
