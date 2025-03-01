import { Module } from '@nestjs/common';
import { IplookupService } from './iplookup.service';

@Module({
  providers: [IplookupService],
  exports: [IplookupService],
})
export class IplookupModule {}
