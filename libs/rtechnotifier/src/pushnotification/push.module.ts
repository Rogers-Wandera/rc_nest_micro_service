import { Global, Module } from '@nestjs/common';
import { RTECHPushNotificationService } from './push.service';

@Global()
@Module({
  imports: [],
  providers: [RTECHPushNotificationService],
  exports: [RTECHPushNotificationService],
})
export class RTECHPushNotificationModule {}
