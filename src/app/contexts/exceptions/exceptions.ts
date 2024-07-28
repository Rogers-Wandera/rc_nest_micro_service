import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = 'Internal Server Error';
    let stackTrace = '';

    if (exception instanceof NotFoundException) {
      errorMessage = exception.message;
      httpStatus = exception.getStatus();
      stackTrace = exception.stack;
    } else if (exception instanceof HttpException) {
      errorMessage = exception.message;
      httpStatus = exception.getStatus();
      stackTrace = exception.stack;
    } else if (exception instanceof BadRequestException) {
      errorMessage = exception.message;
      httpStatus = exception.getStatus();
      stackTrace = exception.stack;
    } else if (exception instanceof RpcException) {
      if (typeof exception.getError() === 'object') {
        errorMessage = exception.getError()['error'];
      } else if (typeof exception.getError() === 'string') {
        errorMessage = exception.getError() as string;
      }
      httpStatus = HttpStatus.BAD_REQUEST;
      stackTrace = exception.stack;
    } else if (typeof exception === 'string') {
      errorMessage = exception;
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      stackTrace = exception.stack || '';
    }

    const errorResponse = {
      statusCode: httpStatus,
      path: request.url,
      timestamp: new Date().toISOString(),
      message: errorMessage,
      stack: stackTrace,
    };

    throw errorResponse;
  }
}
