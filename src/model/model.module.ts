import { Global, Module } from '@nestjs/common';
import { EntityDataSource } from './enity.data.model';

@Global()
@Module({
  providers: [EntityDataSource],
  exports: [EntityDataSource],
})
export class ModelModule {}
