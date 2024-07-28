import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RmqContext } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';
import { catchError, retry, throwError } from 'rxjs';
import { RETRY_KEY } from 'src/app/decorators/retry.decorator';
import { ErrorResponse } from 'src/app/types/error.types';

@Injectable()
export class RetryInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler<any>) {
    const retries =
      this.reflector.get<number>(RETRY_KEY, context.getHandler()) || 0;

    return next.handle().pipe(
      retry(retries),
      catchError((err: ErrorResponse) => {
        const rmqContext = context.switchToRpc().getContext<RmqContext>();
        const channel = rmqContext.getChannelRef() as Channel;
        const originalMessage = rmqContext.getMessage() as Message;
        err.message = `${err.message} Retried ${retries} times but failed`;
        channel.nack(originalMessage, false, false);
        return throwError(() => new BadRequestException(err));
      }),
    );
  }
}
