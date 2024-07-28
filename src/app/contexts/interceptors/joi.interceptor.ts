import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ObjectSchema } from 'joi';

type schema<R> = ObjectSchema<R>;

@Injectable()
export class JoiValidator<T> implements NestInterceptor {
  constructor(private schema: schema<T>) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const data = context.switchToRpc().getData();
    if (!data) throw new RpcException(`Validation error: No data provided`);
    const { error } = this.schema.validate(data);
    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join('; ');
      throw new RpcException(`Validation error: ${errorMessage}`);
    }
    return next.handle();
  }
}
