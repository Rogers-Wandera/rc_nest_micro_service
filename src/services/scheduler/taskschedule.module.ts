import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskScheduleService } from './taskschedule.service';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [TaskScheduleService],
  exports: [TaskScheduleService],
})
export class TaskScheduleModule {}
