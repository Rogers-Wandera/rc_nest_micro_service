import { HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
  statusCode: HttpStatus;
  path: string;
  timestamp: string;
  message: string;
  stack: string;
}
