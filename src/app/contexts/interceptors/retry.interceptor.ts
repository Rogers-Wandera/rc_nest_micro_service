import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RmqContext } from '@nestjs/microservices';
import { NotificationOptions } from '@notifier/rtechnotifier/types/notify.types';
import { Channel, Message } from 'amqplib';
import { firstValueFrom, retry } from 'rxjs';
import { RETRY_KEY } from 'src/app/decorators/retry.decorator';
import { ErrorResponse } from 'src/app/types/error.types';
import { NotificationResendService } from 'src/services/notifications/notificationresend/notificationresend.service';

@Injectable()
export class RetryInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private resendservice: NotificationResendService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const retries =
      this.reflector.get<number>(RETRY_KEY, context.getHandler()) || 0;

    try {
      return await firstValueFrom(next.handle().pipe(retry(retries)));
    } catch (err: any) {
      const rmqContext = context.switchToRpc().getContext<RmqContext>();
      const channel = rmqContext.getChannelRef() as Channel;
      const originalMessage = rmqContext.getMessage() as Message;
      const data = context.switchToRpc().getData() as NotificationOptions;

      // Send a notification to the failed queue
      if (data.type === 'sms') {
        this.resendservice.ResendSmsService(data);
      } else if (data.type === 'email') {
        this.resendservice.ResendEmailService(data);
      }

      // Modify error message and nack the message
      err.message = `${err.message} Retried ${retries} times but failed, Automatic resending enabled`;
      channel.nack(originalMessage, false, false);

      throw new BadRequestException(err);
    }
  }
}
